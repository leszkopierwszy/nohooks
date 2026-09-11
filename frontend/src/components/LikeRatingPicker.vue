<template>
  <div
    class="inline-flex items-center gap-1"
    :class="size === 'lg' ? 'gap-2' : 'gap-1'"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <button
      v-for="level in LIKE_RATING_LEVELS"
      :key="level.value"
      type="button"
      class="rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      :class="[
        size === 'lg' ? 'text-3xl p-1' : size === 'sm' ? 'text-lg p-0.5' : 'text-2xl p-0.5',
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
        modelValue === level.value ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-70',
      ]"
      :disabled="readonly"
      :aria-checked="modelValue === level.value"
      :aria-label="level.label"
      role="radio"
      @click="onSelect(level.value)"
    >
      <span aria-hidden="true">{{ level.emoji }}</span>
    </button>
    <button
      v-if="!readonly && modelValue != null"
      type="button"
      class="ml-1 text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
      @click="onSelect(null)"
    >
      Wyczyść
    </button>
  </div>
  <p
    v-if="showLabel && activeLevel"
    class="mt-1 text-sm text-gray-600"
  >
    {{ activeLevel.label }}
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { LIKE_RATING_LEVELS, likeRatingLevel } from '../constants/itemLikeRating'

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  ariaLabel: {
    type: String,
    default: 'Ocena produktu',
  },
})

const emit = defineEmits(['update:modelValue'])

const activeLevel = computed(() => likeRatingLevel(props.modelValue))

function onSelect(value) {
  if (props.readonly) return
  if (value === props.modelValue) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', value)
}
</script>
