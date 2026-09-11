<template>
  <article
    class="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
    :class="completed ? 'opacity-95' : ''"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-1.5">
        <span
          class="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          :class="typeBadgeClass"
        >
          {{ typeLabel }}
        </span>
        <span
          v-if="!completed && goal.reminders_enabled && goal.event_date"
          class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700 ring-1 ring-inset ring-stone-200/80"
        >
          <span class="size-1.5 rounded-full bg-stone-500" aria-hidden="true" />
          {{ t('growth.card.monitored') }}
        </span>
        <span
          v-if="!completed && isOverdue"
          class="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200/80"
        >
          {{ t('growth.card.overdue') }}
        </span>
      </div>
      <time v-if="completed && goal.completed_at" class="shrink-0 text-[11px] text-gray-400">
        {{ formatDate(goal.completed_at) }}
      </time>
    </div>

    <h3 class="mt-2 text-base font-semibold text-gray-900">{{ goal.title }}</h3>
    <p v-if="goal.description" class="mt-1 line-clamp-3 text-sm text-gray-600">
      {{ goal.description }}
    </p>

    <div
      v-if="!completed && (goal.event_date || goal.load_level != null)"
      class="mt-3 flex flex-wrap gap-2 text-xs"
    >
      <span
        v-if="goal.event_date"
        class="inline-flex items-center gap-1 rounded-lg bg-stone-50 px-2.5 py-1.5 font-medium text-stone-700 ring-1 ring-inset ring-stone-200/80"
      >
        <span aria-hidden="true">📅</span>
        {{ formatEventDate(goal.event_date) }}
        <span v-if="daysLeft != null" class="text-stone-500">· {{ daysLeftLabel }}</span>
      </span>
      <span
        v-if="loadMeta"
        class="inline-flex items-center gap-1 rounded-lg bg-stone-50 px-2.5 py-1.5 font-medium text-stone-700 ring-1 ring-inset ring-stone-200/80"
      >
        <span aria-hidden="true">{{ loadMeta.emoji }}</span>
        {{ t('growth.card.load') }}: {{ t(loadMeta.labelKey) }}
      </span>
      <span
        v-if="workMinutes > 0"
        class="inline-flex items-center gap-1 rounded-lg bg-stone-50 px-2.5 py-1.5 font-medium text-stone-700 ring-1 ring-inset ring-stone-200/80"
      >
        <span aria-hidden="true">⏱</span>
        {{ t('growth.card.workLogged', { duration: workDurationLabel }) }}
      </span>
    </div>

    <div
      v-if="completed && goal.mood != null"
      class="mt-3 flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2"
    >
      <span class="text-xl" aria-hidden="true">{{ moodEmoji }}</span>
      <div class="min-w-0">
        <p class="text-xs font-medium text-gray-500">{{ t('growth.card.moodAfter') }}</p>
        <p class="text-sm font-medium text-gray-800">{{ moodLabel }}</p>
      </div>
    </div>
    <p v-if="completed && goal.completion_note" class="mt-2 text-xs text-gray-500">
      {{ goal.completion_note }}
    </p>

    <div class="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
      <template v-if="!completed">
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
          @click="$emit('complete', goal)"
        >
          {{ t('growth.card.complete') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
          @click="$emit('log-work', goal)"
        >
          {{ t('growth.card.logWork') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-stone-200 hover:bg-stone-50"
          @click="$emit('edit', goal)"
        >
          {{ t('growth.card.edit') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          @click="$emit('delete', goal)"
        >
          {{ t('growth.card.delete') }}
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-stone-200 hover:bg-stone-50"
          @click="$emit('reopen', goal)"
        >
          {{ t('growth.card.reopen') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          @click="$emit('delete', goal)"
        >
          {{ t('growth.card.delete') }}
        </button>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { growthLoadMeta, growthMoodMeta, growthTypeMeta } from '../../constants/growthGoals'
import { daysUntilEvent, isEventOverdue } from '../../utils/growthGoalReminders'
import { formatWorkDuration } from '../../utils/growthGoalWork'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  goal: { type: Object, required: true },
  completed: { type: Boolean, default: false },
  workMinutes: { type: Number, default: 0 },
})

defineEmits(['complete', 'edit', 'delete', 'reopen', 'log-work'])

const { t } = useI18n()

const typeMeta = computed(() => growthTypeMeta(props.goal.type))
const typeLabel = computed(() => t(typeMeta.value.labelKey))

const typeBadgeClass = computed(() => {
  const map = {
    achievement: 'bg-stone-100 text-stone-800',
    event: 'bg-stone-200/70 text-stone-800',
    book: 'bg-stone-100 text-stone-700',
  }
  return map[props.goal.type] ?? 'bg-gray-100 text-gray-700'
})

const loadMeta = computed(() =>
  props.goal.load_level != null ? growthLoadMeta(props.goal.load_level) : null,
)

const moodMeta = computed(() => growthMoodMeta(props.goal.mood))
const moodEmoji = computed(() => moodMeta.value?.emoji ?? '')
const moodLabel = computed(() => (moodMeta.value ? t(moodMeta.value.labelKey) : ''))

const workDurationLabel = computed(() => formatWorkDuration(props.workMinutes))

const isOverdue = computed(() => isEventOverdue(props.goal))
const daysLeft = computed(() =>
  props.goal.event_date ? daysUntilEvent(props.goal.event_date) : null,
)

const daysLeftLabel = computed(() => {
  const d = daysLeft.value
  if (d == null) return ''
  if (d < 0) return t('growth.card.daysOverdue', { days: Math.abs(d) })
  if (d === 0) return t('growth.card.today')
  if (d === 1) return t('growth.card.tomorrow')
  return t('growth.card.daysLeft', { days: d })
})

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function formatEventDate(dateKey) {
  try {
    return new Date(dateKey + 'T12:00:00').toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}
</script>
