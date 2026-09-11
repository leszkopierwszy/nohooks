<template>
  <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">Calendar</h1>
      <p class="mt-1 text-sm text-gray-600">
        Kalendarz wydarzeń, przypomnień i zaplanowanych wydatków.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <div
        class="inline-flex rounded-lg bg-gray-100 p-1 shadow-inner ring-1 ring-gray-200/80"
        role="group"
        aria-label="Widok kalendarza"
      >
        <button
          v-for="opt in CALENDAR_VIEWS"
          :key="opt.value"
          type="button"
          :class="[
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            modelValue === opt.value
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200/80'
              : 'text-gray-600 hover:text-gray-900',
          ]"
          @click="$emit('update:modelValue', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        @click="$emit('add')"
      >
        Dodaj wpis
      </button>
    </div>
  </div>
</template>

<script setup>
import { CALENDAR_VIEWS } from '../../constants/timelineCalendar'

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

defineEmits(['update:modelValue', 'add'])
</script>
