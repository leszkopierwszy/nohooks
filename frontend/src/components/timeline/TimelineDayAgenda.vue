<template>
  <div class="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-200/80">
    <p class="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
      {{ formatEventDate(selectedDate) }}
    </p>
    <p class="mt-1 text-center text-2xl font-bold tabular-nums text-gray-900">
      {{ dayTitle }}
    </p>
    <ul v-if="events.length" class="mt-6 divide-y divide-gray-100">
      <li
        v-for="event in events"
        :key="event.id"
        :class="[
          'cursor-pointer py-3 transition first:pt-0 hover:bg-gray-50/80',
          highlightedEventId != null && highlightedEventId === event.id ? 'bg-indigo-50/60' : '',
        ]"
        @click="$emit('select-event', event)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2 text-sm font-medium text-gray-900">
              <span v-bind="timelineEventDotAttrs(event, 'size-2')" />
              {{ event.label }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ timelineEventTypeMeta(event.type).label }}
              <span v-if="isYearlyRecurring(event) && yearlyRecurrenceLabel(event)">
                · {{ yearlyRecurrenceLabel(event) }}
              </span>
              <span v-else-if="formatTimeRange(event)"> · {{ formatTimeRange(event) }}</span>
            </p>
            <p
              v-if="event.type === 'planned_expense' && event.planned_amount != null"
              class="mt-1 text-xs font-medium text-rose-700"
            >
              {{ formatMoney(event.planned_amount, event.currency ?? 'PLN') }}
            </p>
            <p v-if="event.location" class="mt-1 text-xs text-gray-500">
              {{ event.location }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              @click.stop="$emit('edit', event)"
            >
              Edytuj
            </button>
            <button
              type="button"
              class="text-xs font-medium text-gray-500 hover:text-gray-800"
              @click.stop="$emit('remove', event)"
            >
              Usuń
            </button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="mt-6 text-center text-sm text-gray-500">
      {{ searchActive ? 'Brak pasujących wpisów tego dnia.' : 'Brak wpisów tego dnia.' }}
    </p>
    <button
      type="button"
      class="mt-6 w-full rounded-md border border-dashed border-gray-300 py-2 text-sm font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50"
      @click="$emit('create', selectedDate)"
    >
      + Dodaj wpis
    </button>

    <OutfitDaySection
      :selected-date="selectedDate"
      :outfits="outfits"
      @create="$emit('create-outfit')"
      @edit="$emit('edit-outfit', $event)"
      @remove="$emit('remove-outfit', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import OutfitDaySection from '../outfit/OutfitDaySection.vue'
import { timelineEventTypeMeta } from '../../constants/timelineEventTypes'
import { formatEventDate, formatTimeRange, parseDateKey } from '../../utils/calendarGrid'
import { formatMoney } from '../../utils/currency'
import { timelineEventDotAttrs } from '../../utils/timelineEventColor'
import { isYearlyRecurring, yearlyRecurrenceLabel } from '../../utils/timelineRecurrence'

const props = defineProps({
  selectedDate: { type: String, required: true },
  events: { type: Array, required: true },
  outfits: { type: Array, default: () => [] },
  searchActive: { type: Boolean, default: false },
  highlightedEventId: { type: [Number, String], default: null },
})

defineEmits(['select-event', 'edit', 'remove', 'create', 'create-outfit', 'edit-outfit', 'remove-outfit'])

const dayTitle = computed(() =>
  new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(props.selectedDate))
)
</script>
