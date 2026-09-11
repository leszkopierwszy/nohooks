<template>
  <OverviewBentoCard
    :title="t('overview.day.title')"
    :subtitle="daySubtitle"
    :class="tall ? 'flex h-full min-h-0 flex-col' : ''"
  >
    <template #actions>
      <router-link
        :to="calendarLink"
        class="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        {{ t('overview.day.open') }} →
      </router-link>
    </template>

    <p class="shrink-0 text-center text-2xl font-bold tabular-nums tracking-tight text-gray-900">
      {{ dayTitle }}
    </p>

    <ul
      v-if="events.length"
      :class="[
        'mt-5 divide-y divide-gray-100 overflow-y-auto',
        tall ? 'min-h-0 flex-1' : 'max-h-[min(24rem,50vh)]',
      ]"
    >
      <li v-for="event in events" :key="event.id">
        <button
          type="button"
          class="flex w-full items-start gap-3 py-3 text-left transition first:pt-0 hover:bg-gray-50/80"
          @click="$emit('open-event', event)"
        >
          <span
            class="mt-1.5 shrink-0"
            v-bind="timelineEventDotAttrs(event, 'size-2.5')"
          />
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-gray-900">{{ event.label }}</span>
            <span class="mt-0.5 block text-xs text-gray-500">
              {{ timelineEventTypeMeta(event.type).label }}
              <template v-if="isYearlyRecurring(event) && yearlyRecurrenceLabel(event)">
                · {{ yearlyRecurrenceLabel(event) }}
              </template>
              <template v-else-if="formatTimeRange(event)"> · {{ formatTimeRange(event) }}</template>
            </span>
            <span
              v-if="event.type === 'planned_expense' && event.planned_amount != null"
              class="mt-1 block text-xs font-medium text-rose-700"
            >
              {{ formatMoney(event.planned_amount, event.currency ?? 'PLN') }}
            </span>
            <span v-if="event.location" class="mt-0.5 block text-xs text-gray-500">
              {{ event.location }}
            </span>
          </span>
          <ChevronRightIcon class="mt-0.5 size-4 shrink-0 text-gray-300" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p
      v-else
      :class="[
        'rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-center text-sm text-gray-500',
        tall ? 'mt-5 flex flex-1 items-center justify-center py-16' : 'mt-8 py-10',
      ]"
    >
      {{ t('overview.day.empty') }}
    </p>
  </OverviewBentoCard>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../../composables/useI18n'
import { timelineEventTypeMeta } from '../../constants/timelineEventTypes'
import { formatEventDate, formatTimeRange, parseDateKey } from '../../utils/calendarGrid'
import { formatMoney } from '../../utils/currency'
import { timelineEventDotAttrs } from '../../utils/timelineEventColor'
import { isYearlyRecurring, yearlyRecurrenceLabel } from '../../utils/timelineRecurrence'
import OverviewBentoCard from './OverviewBentoCard.vue'

const props = defineProps({
  selectedDate: { type: String, required: true },
  events: { type: Array, required: true },
  tall: { type: Boolean, default: false },
})

defineEmits(['open-event'])

const { t } = useI18n()

const dayTitle = computed(() =>
  new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseDateKey(props.selectedDate)),
)

const daySubtitle = computed(() => formatEventDate(props.selectedDate))

const calendarLink = computed(() => ({
  name: 'Calendar',
  query: { date: props.selectedDate },
}))
</script>
