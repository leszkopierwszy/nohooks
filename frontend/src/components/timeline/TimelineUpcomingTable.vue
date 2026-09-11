<template>
  <section class="mt-12">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Ważne nadchodzące wydarzenia</h2>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="searchActive">Wyniki wyszukiwania (nadchodzące).</template>
          <template v-else>Od dziś w ciągu najbliższych {{ horizonDays }} dni.</template>
        </p>
      </div>
      <p v-if="events.length" class="text-sm text-gray-500">
        {{ events.length }}
        {{ events.length === 1 ? 'wpis' : 'wpisy' }}
      </p>
    </div>

    <div class="mt-4 flow-root overflow-hidden rounded-lg ring-1 ring-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-left">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">Data</th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">Godziny</th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">Typ</th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">Wydarzenie</th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">Kwota</th>
            <th scope="col" class="relative px-4 py-3">
              <span class="sr-only">Akcje</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="event in events"
            :key="event.id"
            :class="rowClassForEvent(event)"
            class="cursor-pointer hover:bg-gray-50"
            @click="$emit('row-click', event)"
          >
            <td class="whitespace-nowrap px-4 py-3 text-sm">
              <div class="font-medium text-gray-900">
                {{ formatEventDate(displayDateKey(event)) }}
              </div>
              <span
                v-if="urgencyLabel(event)"
                :class="urgencyBadgeClass(event)"
                class="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              >
                {{ urgencyLabel(event) }}
              </span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
              {{ formatTimeRange(event) || '—' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">
              <span class="inline-flex items-center gap-1.5 text-gray-700">
                <span v-bind="timelineEventDotAttrs(event, 'size-2')" />
                {{ timelineEventTypeMeta(event.type).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <p class="font-medium text-gray-900">{{ event.label }}</p>
              <p v-if="event.location" class="mt-0.5 max-w-md truncate text-gray-500">
                {{ event.location }}
              </p>
              <p v-if="eventNotes(event)" class="mt-0.5 max-w-md truncate text-gray-500">
                {{ eventNotes(event) }}
              </p>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">
              <span
                v-if="event.type === 'planned_expense' && event.planned_amount != null"
                class="font-medium text-rose-700"
              >
                {{ formatMoney(event.planned_amount, event.currency ?? 'PLN') }}
              </span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
              <div class="inline-flex gap-3">
                <button
                  type="button"
                  class="font-medium text-indigo-600 hover:text-indigo-500"
                  @click.stop="$emit('edit', event)"
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  class="font-medium text-rose-600 hover:text-rose-500"
                  @click.stop="$emit('remove', event)"
                >
                  Usuń
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="!events.length && !loading"
        class="px-4 py-8 text-center text-sm text-gray-500"
      >
        {{
          searchActive
            ? 'Brak nadchodzących wydarzeń pasujących do wyszukiwania.'
            : 'Brak nadchodzących wydarzeń w wybranym horyzoncie.'
        }}
      </p>
      <p v-else-if="loading" class="px-4 py-8 text-center text-sm text-gray-500">Ładowanie…</p>
    </div>
  </section>
</template>

<script setup>
import { timelineEventTypeMeta } from '../../constants/timelineEventTypes'
import { daysFromToday, formatEventDate, formatTimeRange } from '../../utils/calendarGrid'
import { formatMoney } from '../../utils/currency'
import { eventNotes } from '../../utils/timelineEvent'
import { timelineEventDotAttrs } from '../../utils/timelineEventColor'
import { displayDateKey } from '../../utils/timelineRecurrence'

defineProps({
  events: { type: Array, required: true },
  horizonDays: { type: Number, required: true },
  searchActive: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['row-click', 'edit', 'remove'])

function urgencyLabel(event) {
  const days = daysFromToday(displayDateKey(event))
  if (days === 0) return 'Dziś'
  if (days === 1) return 'Jutro'
  if (days >= 2 && days <= 7) return 'Ten tydzień'
  return null
}

function urgencyBadgeClass(event) {
  const days = daysFromToday(displayDateKey(event))
  if (days === 0) return 'bg-indigo-100 text-indigo-800'
  if (days === 1) return 'bg-amber-100 text-amber-800'
  if (days <= 7) return 'bg-gray-100 text-gray-700'
  return 'bg-gray-100 text-gray-600'
}

function rowClassForEvent(event) {
  const days = daysFromToday(displayDateKey(event))
  if (days === 0) return 'bg-indigo-50/50'
  if (days <= 3) return 'bg-amber-50/30'
  return ''
}
</script>
