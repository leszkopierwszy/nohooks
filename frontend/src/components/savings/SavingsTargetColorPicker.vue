<template>
  <div>
    <span class="block text-sm font-medium text-gray-700">Kolor</span>
    <div class="mt-2 flex flex-wrap gap-2" role="radiogroup" :aria-label="ariaLabel">
      <button
        v-for="opt in SAVINGS_TARGET_COLORS"
        :key="opt.value"
        type="button"
        role="radio"
        :aria-checked="modelValue === opt.value"
        :title="opt.label"
        :class="[
          'relative size-9 rounded-full ring-2 ring-offset-2 transition focus:outline-hidden focus-visible:ring-2',
          swatchClass(opt.value),
          modelValue === opt.value ? 'ring-gray-900' : 'ring-transparent hover:ring-gray-300',
        ]"
        @click="$emit('update:modelValue', opt.value)"
      >
        <span class="sr-only">{{ opt.label }}</span>
        <CheckIcon
          v-if="modelValue === opt.value"
          class="absolute inset-0 m-auto size-5 text-white drop-shadow-sm"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { CheckIcon } from '@heroicons/vue/24/solid'
import { SAVINGS_TARGET_COLORS } from '../../constants/savingsTargetColors'

defineProps({
  modelValue: { type: String, required: true },
  ariaLabel: { type: String, default: 'Kolor targetu' },
})

defineEmits(['update:modelValue'])

const swatchBg = {
  indigo: 'bg-indigo-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  blue: 'bg-sky-500',
  yellow: 'bg-yellow-400',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
}

function swatchClass(value) {
  return swatchBg[value] ?? swatchBg.indigo
}
</script>
