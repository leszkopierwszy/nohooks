<template>
  <div>
    <div class="mt-6 grid grid-cols-7 text-center text-xs/6 font-medium text-gray-500">
      <div v-for="label in weekdays" :key="label">{{ label }}</div>
    </div>

    <div
      class="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-sm ring-1 ring-gray-200"
    >
      <button
        v-for="day in calendarDays"
        :key="day.date"
        type="button"
        :data-is-current-month="day.isCurrentMonth ? '' : undefined"
        :data-is-selected="selectedDate === day.date ? '' : undefined"
        :data-is-today="day.isToday ? '' : undefined"
        :data-has-search-match="searchActive && eventsForDay(day.date).length ? '' : undefined"
        :class="[
          'relative min-h-[3.25rem] bg-gray-50 py-1.5 text-left text-gray-400 first:rounded-tl-lg last:rounded-br-lg hover:bg-gray-100 focus:z-10 data-is-current-month:bg-white data-is-current-month:text-gray-900 data-is-current-month:hover:bg-gray-100 data-is-selected:ring-2 data-is-selected:ring-inset data-is-selected:ring-indigo-600 nth-36:rounded-bl-lg nth-7:rounded-tr-lg in-data-has-search-match:bg-indigo-50/80',
          searchActive && day.isCurrentMonth && !eventsForDay(day.date).length ? 'opacity-40' : '',
        ]"
        @click="$emit('select-day', day)"
        @dblclick="$emit('create', day.date)"
      >
        <time
          :datetime="day.date"
          class="mx-auto flex size-7 items-center justify-center rounded-full in-data-is-today:bg-indigo-600 in-data-is-today:font-semibold in-data-is-today:text-white"
        >
          {{ day.day }}
        </time>
        <div
          v-if="eventsForDay(day.date).length"
          class="mt-0.5 flex flex-wrap justify-center gap-0.5 px-1"
        >
          <span
            v-for="ev in eventsForDay(day.date).slice(0, 3)"
            :key="ev.id"
            v-bind="timelineEventDotAttrs(ev, 'size-1.5')"
            :title="ev.label"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { weekdayLabels } from '../../utils/calendarGrid'
import { timelineEventDotAttrs } from '../../utils/timelineEventColor'

const weekdays = weekdayLabels()

defineProps({
  calendarDays: { type: Array, required: true },
  selectedDate: { type: String, required: true },
  searchActive: { type: Boolean, default: false },
  /** (dateKey: string) => TimelineEvent[] */
  eventsForDay: { type: Function, required: true },
})

defineEmits(['select-day', 'create'])
</script>
