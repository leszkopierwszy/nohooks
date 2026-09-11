<template>
  <OverviewBentoCard :title="t('overview.calendar.title')" dense class="h-full min-h-0">
    <template #actions>
      <router-link
        :to="{ name: 'Calendar' }"
        class="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        {{ t('overview.calendar.open') }} →
      </router-link>
    </template>

    <TimelineCalendarShell
      :title="calendarTitle"
      :prev-label="t('overview.calendar.prevMonth')"
      :next-label="t('overview.calendar.nextMonth')"
      @prev="$emit('prev-month')"
      @next="$emit('next-month')"
    >
      <TimelineMonthGrid
        :calendar-days="calendarDays"
        :selected-date="selectedDate"
        :search-active="false"
        :events-for-day="eventsForDay"
        @select-day="$emit('select-day', $event)"
      />
    </TimelineCalendarShell>

    <p v-if="loading" class="mt-3 text-center text-xs text-gray-500">{{ t('common.loading') }}</p>
  </OverviewBentoCard>
</template>

<script setup>
import { useI18n } from '../../composables/useI18n'
import TimelineCalendarShell from '../timeline/TimelineCalendarShell.vue'
import TimelineMonthGrid from '../timeline/TimelineMonthGrid.vue'
import OverviewBentoCard from './OverviewBentoCard.vue'

const { t } = useI18n()

defineProps({
  calendarDays: { type: Array, required: true },
  calendarTitle: { type: String, required: true },
  selectedDate: { type: String, required: true },
  eventsForDay: { type: Function, required: true },
  loading: { type: Boolean, default: false },
})

defineEmits(['select-day', 'prev-month', 'next-month'])
</script>
