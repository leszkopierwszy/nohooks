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

    <form
      v-if="showForm"
      class="mt-8 max-w-xl rounded-xl border border-gray-200 bg-gray-50/80 p-5 ring-1 ring-gray-900/5"
      @submit.prevent="submitPrim"
    >
      <h2 class="text-sm font-semibold text-gray-900">{{ t('souls.prims.new') }}</h2>
      <div class="mt-4 space-y-4">
        <div>
          <label for="prim-name" class="block text-sm font-medium text-gray-700">
            {{ t('souls.prims.name') }}
          </label>
          <input
            id="prim-name"
            ref="nameInputRef"
            v-model="form.name"
            type="text"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            :placeholder="t('souls.prims.namePlaceholder')"
          />
        </div>

        <div>
          <label for="prim-gender" class="block text-sm font-medium text-gray-700">
            {{ t('souls.prims.gender') }}
          </label>
          <select
            id="prim-gender"
            v-model="form.gender"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">{{ t('souls.prims.genderUnknown') }}</option>
            <option value="female">{{ t('souls.prims.genderFemale') }}</option>
            <option value="male">{{ t('souls.prims.genderMale') }}</option>
            <option value="nonbinary">{{ t('souls.prims.genderNonbinary') }}</option>
            <option value="gay">{{ t('souls.prims.genderGay') }}</option>
          </select>
        </div>

        <div>
          <label for="prim-description" class="block text-sm font-medium text-gray-700">
            {{ t('souls.prims.description') }}
          </label>
          <textarea
            id="prim-description"
            v-model="form.description"
            rows="3"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            :placeholder="t('souls.prims.descriptionPlaceholder')"
          />
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? t('souls.prims.adding') : t('souls.prims.add') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          @click="cancelForm"
        >
          {{ t('souls.prims.cancel') }}
        </button>
      </div>
      <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
    </form>

    <div v-else class="mt-8">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        @click="openAddForm"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        {{ t('souls.prims.add') }}
      </button>
    </div>

    <p v-if="personasStore.loading" class="mt-8 text-sm text-gray-500">{{ t('souls.prims.loading') }}</p>
    <p v-else-if="personasStore.error" class="mt-8 text-sm text-red-600">{{ personasStore.error }}</p>

    <ul
      v-else-if="personasStore.prims.length"
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

    <p
      v-else-if="!personasStore.loading && !showForm"
      class="mt-8 text-sm text-gray-500"
    >
      {{ t('souls.prims.empty') }}
    </p>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import PersonaSwitcher from './PersonaSwitcher.vue'
import { useI18n } from '../composables/useI18n'
import { SOUL_TYPE_PRIM } from '../constants/soulTypes'
import { usePersonasStore } from '../stores/personas'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const personasStore = usePersonasStore()

const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const nameInputRef = ref(null)

const form = reactive({
  name: '',
  gender: '',
  description: '',
})

onMounted(() => {
  personasStore.fetchPersonas().catch(() => {})
  if (route.query.add === '1') openAddForm()
})

watch(
  () => route.query.add,
  (value) => {
    if (value === '1') openAddForm()
  },
)

function resetForm() {
  Object.assign(form, { name: '', gender: '', description: '' })
}

function openAddForm() {
  showForm.value = true
  formError.value = ''
  resetForm()
  nextTick(() => nameInputRef.value?.focus())
}

function cancelForm() {
  showForm.value = false
  formError.value = ''
  resetForm()
  if (route.query.add === '1') {
    router.replace({ query: { ...route.query, add: undefined } })
  }
}

async function submitPrim() {
  formError.value = ''
  saving.value = true
  try {
    const entity = await personasStore.createSoul({
      name: form.name,
      type: SOUL_TYPE_PRIM,
      description: form.description,
      gender: form.gender || null,
    })
    personasStore.setActivePersona(entity.id)
    cancelForm()
  } catch (err) {
    formError.value = err?.message || t('souls.prims.addError')
  } finally {
    saving.value = false
  }
}

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
