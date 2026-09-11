<template>
  <div class="min-w-0">
    <p class="text-sm font-semibold text-gray-900">{{ label }}</p>
    <p v-if="hint" class="mt-1 text-xs leading-relaxed text-gray-500">{{ hint }}</p>
    <div class="mt-2.5 flex flex-wrap gap-1.5">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        :class="[
          'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-150',
          modelValue.includes(opt.value) ? growthChipActive : growthChipIdle,
        ]"
        @click="toggle(opt.value)"
      >
        {{ t(opt.labelKey) }}
      </button>
    </div>
    <input
      v-if="allowCustom"
      :value="customValue"
      type="text"
      :placeholder="customPlaceholder"
      class="mt-2.5 block w-full rounded-lg border-0 bg-white py-2 pl-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-stone-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400"
      @input="$emit('update:customValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { growthChipActive, growthChipIdle } from '../../constants/growthUi'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  options: { type: Array, required: true },
  modelValue: { type: Array, default: () => [] },
  allowCustom: { type: Boolean, default: false },
  customValue: { type: String, default: '' },
  customPlaceholder: { type: String, default: '' },
  variant: { type: String, default: 'default' },
})

const emit = defineEmits(['update:modelValue', 'update:customValue'])

const { t } = useI18n()

function toggle(value) {
  const set = new Set(props.modelValue)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  emit('update:modelValue', [...set])
}
</script>
