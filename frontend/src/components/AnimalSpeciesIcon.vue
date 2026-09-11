<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
      sizeClasses,
      meta.ring,
    ]"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    role="img"
  >
    <span :class="['leading-none select-none', emojiSizeClass, meta.text]">{{ meta.emoji }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getAnimalSpeciesIcon } from '../utils/animalSpeciesIcons'

const props = defineProps({
  species: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  /** Dostępność — np. „Kot” */
  label: {
    type: String,
    default: '',
  },
})

const meta = computed(() => getAnimalSpeciesIcon(props.species))

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'size-8'
  if (props.size === 'lg') return 'size-14'
  return 'size-12'
})

const emojiSizeClass = computed(() => {
  if (props.size === 'sm') return 'text-base'
  if (props.size === 'lg') return 'text-2xl'
  return 'text-xl'
})
</script>
