<template>
  <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <h2 class="text-base font-semibold text-gray-900">
      {{ selectedDate ? formatEventDate(selectedDate) : 'Wybierz dzień' }}
    </h2>
    <p v-if="!selectedDate" class="mt-2 text-sm text-gray-500">
      Kliknij dzień w kalendarzu, aby zobaczyć wpisy.
    </p>
    <ul v-else-if="events.length" class="mt-4 space-y-3">
      <li
        v-for="event in events"
        :key="event.id"
        :class="[
          'cursor-pointer rounded-md border px-3 py-2 transition hover:border-indigo-200 hover:bg-indigo-50/50',
          highlightedEventId != null && highlightedEventId === event.id
            ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
            : 'border-gray-100 bg-gray-50',
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
            <p v-if="eventNotes(event)" class="mt-1 text-xs text-gray-600 line-clamp-2">
              {{ eventNotes(event) }}
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
    <p v-else class="mt-4 text-sm text-gray-500">
      {{ searchActive ? 'Brak pasujących wpisów w tym dniu.' : 'Brak wpisów w tym dniu.' }}
    </p>
    <button
      v-if="selectedDate"
      type="button"
      class="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      @click="$emit('create', selectedDate)"
    >
      + Dodaj wpis na ten dzień
    </button>

    <OutfitDaySection
      v-if="selectedDate"
      :selected-date="selectedDate"
      :outfits="outfits"
      @create="$emit('create-outfit')"
      @edit="$emit('edit-outfit', $event)"
      @remove="$emit('remove-outfit', $event)"
    />
  </section>
</template>

<script setup>
import OutfitDaySection from '../outfit/OutfitDaySection.vue'
import { timelineEventTypeMeta } from '../../constants/timelineEventTypes'
import { formatEventDate, formatTimeRange } from '../../utils/calendarGrid'
import { formatMoney } from '../../utils/currency'
import { eventNotes } from '../../utils/timelineEvent'
import { timelineEventDotAttrs } from '../../utils/timelineEventColor'
import { isYearlyRecurring, yearlyRecurrenceLabel } from '../../utils/timelineRecurrence'

defineProps({
  selectedDate: { type: String, default: '' },
  events: { type: Array, required: true },
  outfits: { type: Array, default: () => [] },
  searchActive: { type: Boolean, default: false },
  highlightedEventId: { type: [Number, String], default: null },
})

defineEmits(['select-event', 'edit', 'remove', 'create', 'create-outfit', 'edit-outfit', 'remove-outfit'])
</script>
