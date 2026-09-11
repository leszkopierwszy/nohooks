<template>
  <div class="flex flex-wrap gap-2" role="tablist" aria-label="Wybór Prima">
    <button
      v-for="persona in personasStore.prims"
      :key="persona.id"
      type="button"
      role="tab"
      :aria-selected="isActive(persona.id)"
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
      :class="
        isActive(persona.id)
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
      "
      @click="select(persona.id)"
    >
      <img
        v-if="persona.imageUrl"
        :src="persona.imageUrl"
        alt=""
        class="size-6 rounded-full object-cover"
      />
      <span
        v-else
        class="flex size-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600"
      >
        {{ initials(persona.name) }}
      </span>
      {{ persona.name }}
    </button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePersonasStore } from '../stores/personas'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const personasStore = usePersonasStore()

onMounted(() => {
  personasStore.fetchPersonas().catch(() => {})
})

function isActive(id) {
  const current = props.modelValue ?? personasStore.activePersonaId
  return String(current) === String(id)
}

function select(id) {
  personasStore.setActivePersona(id)
  emit('update:modelValue', Number(id))
  emit('change', Number(id))
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
</script>
