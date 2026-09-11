<template>
  <div>
    <div class="border-b border-gray-200 pb-6">
      <h3 class="text-4xl font-bold tracking-tight text-gray-900">{{ t('souls.prims.title') }}</h3>
      <p class="mt-2 max-w-4xl text-sm text-gray-500">{{ t('souls.prims.subtitle') }}</p>
      <div class="mt-6">
        <p class="text-sm font-medium text-gray-700">{{ t('souls.prims.activePrim') }}</p>
        <PersonaSwitcher class="mt-2" />
      </div>
    </div>

    <p v-if="personasStore.loading" class="mt-8 text-sm text-gray-500">{{ t('souls.prims.loading') }}</p>
    <p v-else-if="personasStore.error" class="mt-8 text-sm text-red-600">{{ personasStore.error }}</p>

    <ul
      v-else
      role="list"
      class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <li
        v-for="person in personasStore.prims"
        :key="person.id"
        class="col-span-1 flex cursor-pointer flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm ring-1 transition-shadow hover:shadow-md"
        :class="
          personasStore.activePersonaId === person.id
            ? 'ring-indigo-600'
            : 'ring-transparent'
        "
        @click="goToPersona(person)"
      >
        <div class="flex flex-1 flex-col p-8">
          <img
            v-if="person.imageUrl"
            class="mx-auto size-32 shrink-0 rounded-full bg-gray-300 object-cover outline -outline-offset-1 outline-black/5"
            :src="person.imageUrl"
            alt=""
          />
          <div
            v-else
            class="mx-auto flex size-32 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-600"
          >
            {{ initials(person.name) }}
          </div>
          <h3 class="mt-6 text-sm font-medium text-gray-900">{{ person.name }}</h3>
          <dl class="mt-1 flex grow flex-col justify-between">
            <dt class="sr-only">Opis</dt>
            <dd class="text-sm text-gray-500">{{ person.description || '—' }}</dd>
            <dd class="mt-3">
              <span
                v-if="personasStore.activePersonaId === person.id"
                class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 inset-ring inset-ring-indigo-600/20"
              >
                {{ t('souls.prims.active') }}
              </span>
              <span
                v-else
                class="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/20"
              >
                {{ person.type || 'prim' }}
              </span>
            </dd>
          </dl>
        </div>
        <div class="py-3 text-sm font-semibold text-indigo-600">{{ t('souls.prims.viewProfile') }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PersonaSwitcher from './PersonaSwitcher.vue'
import { useI18n } from '../composables/useI18n'
import { usePersonasStore } from '../stores/personas'

const { t } = useI18n()
const router = useRouter()
const personasStore = usePersonasStore()

onMounted(() => {
  personasStore.fetchPersonas().catch(() => {})
})

function goToPersona(person) {
  personasStore.setActivePersona(person.id)
  router.push({
    name: 'PrimOverview',
    params: { id: String(person.id) },
  })
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
