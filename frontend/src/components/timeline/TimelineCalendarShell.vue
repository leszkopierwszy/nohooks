<template>
  <div class="relative">
    <button
      type="button"
      class="absolute -top-1 left-0 flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
      :aria-label="prevLabel"
      @click="$emit('prev')"
    >
      <ChevronLeftIcon class="size-5" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="absolute -top-1 right-0 flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
      :aria-label="nextLabel"
      @click="$emit('next')"
    >
      <ChevronRightIcon class="size-5" aria-hidden="true" />
    </button>

    <h2 class="text-center text-sm font-semibold text-gray-900">
      {{ title }}
    </h2>

    <slot />
  </div>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

defineProps({
  title: { type: String, required: true },
  prevLabel: { type: String, required: true },
  nextLabel: { type: String, required: true },
})

defineEmits(['prev', 'next'])
</script>
