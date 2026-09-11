<template>
  <div>
    <div class="mt-6 grid grid-cols-7 text-center text-xs/6 font-medium text-gray-500">
      <div v-for="d in weekDays" :key="'h-' + d.date">{{ d.weekdayShort }}</div>
    </div>
    <div
      class="isolate mt-2 grid min-h-[min(36rem,calc(100vh-12rem))] grid-cols-7 items-stretch gap-px overflow-hidden rounded-lg bg-gray-200 text-sm shadow-sm ring-1 ring-gray-200"
    >
      <div
        v-for="d in weekDays"
        :key="d.date"
        :data-is-selected="selectedDate === d.date ? '' : undefined"
        :data-is-today="d.isToday ? '' : undefined"
        :data-has-search-match="searchActive && eventsForDay(d.date).length ? '' : undefined"
        class="flex min-h-[28rem] flex-col bg-white first:rounded-tl-lg last:rounded-tr-lg in-data-has-search-match:bg-indigo-50/50 data-is-selected:ring-2 data-is-selected:ring-inset data-is-selected:ring-indigo-600"
      >
        <button
          type="button"
          class="flex w-full shrink-0 items-center gap-2 border-b border-gray-100 px-2 py-2.5 text-left transition hover:bg-gray-50"
          @click="$emit('select-day', d)"
          @dblclick="$emit('create', d.date)"
        >
          <time
            :datetime="d.date"
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-base font-semibold in-data-is-today:bg-indigo-600 in-data-is-today:text-white"
            :data-is-today="d.isToday ? '' : undefined"
          >
            {{ d.day }}
          </time>
          <span class="truncate text-xs text-gray-500">
            {{ shortMonthDayLabel(d.date) }}
          </span>
        </button>
        <ul class="min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5 py-2">
          <li
            v-for="event in eventsForDay(d.date)"
            :key="event.id"
            :class="[
              'cursor-pointer rounded-md px-1.5 py-1.5 transition hover:bg-indigo-50/80',
              highlightedEventId != null && highlightedEventId === event.id
                ? 'bg-indigo-50 ring-1 ring-indigo-200'
                : '',
            ]"
            @click="$emit('select-event', event)"
          >
            <p class="text-[10px] font-semibold leading-tight text-gray-500 tabular-nums">
              {{ weekEventScheduleLine(event) }}
            </p>
            <p class="mt-0.5 truncate text-xs font-medium leading-snug text-gray-900">
              {{ event.label }}
            </p>
          </li>
          <li
            v-if="!eventsForDay(d.date).length"
            class="rounded-md px-1.5 py-6 text-center text-[10px] text-gray-400"
          >
            Brak wpisów
          </li>
        </ul>
        <button
          type="button"
          class="shrink-0 border-t border-gray-100 px-2 py-2 text-center text-[11px] font-medium text-indigo-600 hover:bg-indigo-50/60"
          @click="$emit('create', d.date)"
        >
          + Dodaj
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shortMonthDayLabel, weekEventScheduleLine } from '../../utils/timelineWeekView'

defineProps({
  weekDays: { type: Array, required: true },
  selectedDate: { type: String, required: true },
  searchActive: { type: Boolean, default: false },
  highlightedEventId: { type: [Number, String], default: null },
  eventsForDay: { type: Function, required: true },
})

defineEmits(['select-day', 'select-event', 'create'])
</script>
