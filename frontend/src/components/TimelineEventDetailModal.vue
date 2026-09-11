<template>
  <TransitionRoot as="template" :show="open" @after-leave="$emit('after-leave')">
    <Dialog class="relative z-[60]" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6">
        <div class="flex min-h-full items-center justify-center py-8">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-900/5 sm:p-8"
            >
              <template v-if="displayEvent">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <p class="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <span v-bind="timelineEventDotAttrs(displayEvent, 'size-2.5')" />
                      {{ timelineEventTypeMeta(displayEvent.type).label }}
                    </p>
                    <DialogTitle class="mt-2 text-xl font-semibold text-gray-900">
                      {{ displayEvent.label }}
                    </DialogTitle>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Zamknij"
                    @click="$emit('close')"
                  >
                    <XMarkIcon class="size-5" aria-hidden="true" />
                  </button>
                </div>

                <dl class="mt-6 space-y-4 border-t border-gray-100 pt-6">
                  <template v-if="isYearlyRecurring(displayEvent)">
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {{ isBirthdayEvent(displayEvent) ? 'Data urodzin' : 'Data (powtarzalna)' }}
                      </dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(anchorDateKey(displayEvent)) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                        W {{ currentYear }}
                      </dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(displayDateKey(displayEvent)) }}
                        <span v-if="yearlyRecurrenceLabel(displayEvent)" class="text-gray-600">
                          ({{ yearlyRecurrenceLabel(displayEvent) }})
                        </span>
                      </dd>
                    </div>
                    <div v-if="!isBirthdayEvent(displayEvent)">
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Godziny</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatTimeRange(displayEvent) || 'Cały dzień' }}
                      </dd>
                    </div>
                  </template>
                  <template v-else-if="isPlannedExpenseEvent(displayEvent)">
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Data kotwicy</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(anchorDateKey(displayEvent)) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Interwał</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ plannedExpenseIntervalLabel(displayEvent.recurrence) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Następna płatność
                      </dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(displayDateKey(displayEvent)) }}
                      </dd>
                    </div>
                  </template>
                  <template v-else-if="displayEvent.type === 'growth_goal'">
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Data celu</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(displayDateKey(displayEvent)) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Powiązany cel</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ linkedGoalTitle || '—' }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Godziny</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatTimeRange(displayEvent) || 'Cały dzień' }}
                      </dd>
                    </div>
                  </template>
                  <template v-else-if="displayEvent.type === 'goal_work'">
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Data sesji</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(displayDateKey(displayEvent)) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Cel</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ linkedGoalTitle || '—' }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Czas pracy</dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900">
                        {{ formatWorkDuration(displayEvent.work_minutes) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Godziny</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatTimeRange(displayEvent) || '—' }}
                      </dd>
                    </div>
                  </template>
                  <template v-else>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Data</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatEventDate(displayDateKey(displayEvent)) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Godziny</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {{ formatTimeRange(displayEvent) || 'Cały dzień' }}
                      </dd>
                    </div>
                  </template>
                  <div v-if="displayEvent.type === 'planned_expense'">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Zaplanowana kwota
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span
                        v-if="displayEvent.planned_amount != null"
                        class="font-semibold text-rose-700"
                      >
                        {{ formatMoney(displayEvent.planned_amount, displayEvent.currency ?? 'PLN') }}
                      </span>
                      <span v-else class="text-gray-400">—</span>
                    </dd>
                  </div>
                  <div v-if="displayEvent.type === 'planned_expense'">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Firma</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {{ displayEvent.location?.trim() || '—' }}
                    </dd>
                  </div>
                  <div v-if="displayEvent.type === 'planned_expense'">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Kategoria</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {{ displayEvent.expense_category?.trim() || '—' }}
                    </dd>
                  </div>
                  <div v-if="displayEvent.type === 'planned_expense'">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {{ displayEvent.is_active !== false ? 'Aktywny' : 'Nieaktywny' }}
                    </dd>
                  </div>
                  <div
                    v-else-if="
                      displayEvent.type !== 'goal_work' && displayEvent.type !== 'growth_goal'
                    "
                  >
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Lokalizacja</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {{ displayEvent.location?.trim() || '—' }}
                    </dd>
                  </div>
                  <div v-if="normalizeTimelineEventColor(displayEvent.color)">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Kolor w kalendarzu
                    </dt>
                    <dd class="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <span
                        class="size-4 shrink-0 rounded-full ring-1 ring-black/10"
                        :style="{
                          backgroundColor: normalizeTimelineEventColor(displayEvent.color),
                        }"
                      />
                      <span class="font-mono text-xs text-gray-600">
                        {{ normalizeTimelineEventColor(displayEvent.color) }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Link</dt>
                    <dd class="mt-1 text-sm">
                      <a
                        v-if="formatEventLink(displayEvent.link)"
                        :href="formatEventLink(displayEvent.link)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="break-all font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {{ displayEvent.link }}
                      </a>
                      <span v-else class="text-gray-400">—</span>
                    </dd>
                    </div>
                  <div>
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500">Notatki</dt>
                    <dd class="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {{ eventNotes(displayEvent) || '—' }}
                    </dd>
                  </div>
                </dl>

                <div class="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    @click="$emit('close')"
                  >
                    Zamknij
                  </button>
                  <button
                    type="button"
                    class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    @click="$emit('delete', displayEvent)"
                  >
                    Usuń
                  </button>
                  <button
                    type="button"
                    class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    @click="$emit('edit', displayEvent)"
                  >
                    Edytuj
                  </button>
                </div>
              </template>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGrowthGoalsStore } from '../stores/growthGoals'
import { formatWorkDuration } from '../utils/growthGoalWork'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { timelineEventTypeMeta } from '../constants/timelineEventTypes'
import { formatEventDate, formatTimeRange } from '../utils/calendarGrid'
import { formatMoney } from '../utils/currency'
import { eventNotes, formatEventLink } from '../utils/timelineEvent'
import { plannedExpenseIntervalLabel } from '../constants/plannedExpenseIntervals'
import {
  normalizeTimelineEventColor,
  timelineEventDotAttrs,
} from '../utils/timelineEventColor'
import {
  anchorDateKey,
  displayDateKey,
  isBirthdayEvent,
  isPlannedExpenseEvent,
  isYearlyRecurring,
  yearlyRecurrenceLabel,
} from '../utils/timelineRecurrence'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  event: {
    type: Object,
    default: null,
  },
})

defineEmits(['close', 'after-leave', 'edit', 'delete'])

const growthGoalsStore = useGrowthGoalsStore()
const displayEvent = ref(null)

const linkedGoalTitle = computed(() => {
  const id = displayEvent.value?.growth_goal_id
  if (!id) return ''
  const goal = growthGoalsStore.goals.find((g) => g.id === id)
  return goal?.title ?? ''
})

watch(
  () => props.event,
  (event) => {
    if (event) displayEvent.value = { ...event }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      growthGoalsStore.reload()
      if (props.event) {
        displayEvent.value = { ...props.event }
      }
    }
  }
)

const currentYear = new Date().getFullYear()
</script>
