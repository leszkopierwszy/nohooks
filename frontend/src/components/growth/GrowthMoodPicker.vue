<template>
  <fieldset class="min-w-0">
    <legend class="text-sm font-semibold text-gray-900">
      {{ label }}
      <span v-if="!required" class="font-normal text-gray-500">({{ t('growth.form.optional') }})</span>
    </legend>
    <p v-if="hint" class="mt-1 text-xs leading-relaxed text-gray-500">{{ hint }}</p>
    <div class="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
      <button
        v-for="level in levels"
        :key="level.value"
        type="button"
        :aria-pressed="modelValue === level.value"
        :class="[
          'flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 transition-all duration-150 sm:px-1.5 sm:py-3',
          modelValue === level.value
            ? growthMoodActive
            : 'border-stone-200/90 bg-white text-gray-600 shadow-sm hover:border-stone-300 hover:bg-stone-50/80',
        ]"
        @click="select(level.value)"
      >
        <span
          class="text-xl leading-none transition-transform sm:text-2xl"
          :class="modelValue === level.value ? 'scale-105' : ''"
          aria-hidden="true"
        >
          {{ level.emoji }}
        </span>
        <span class="max-w-full truncate px-0.5 text-[9px] font-medium leading-tight text-stone-600 sm:text-[10px]">
          {{ t(level.labelKey) }}
        </span>
      </button>
    </div>
  </fieldset>
</template>

<script setup>
import { growthMoodActive } from '../../constants/growthUi'
import { useI18n } from '../../composables/useI18n'
import { GROWTH_MOOD_LEVELS } from '../../constants/growthGoals'

const props = defineProps({
  modelValue: { type: Number, default: null },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  levels: { type: Array, default: () => GROWTH_MOOD_LEVELS },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

function select(value) {
  if (!props.required && props.modelValue === value) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', value)
}
</script>
