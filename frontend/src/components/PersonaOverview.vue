<template>
  <div class="bg-white">
    <div class="mx-auto px-4 py-10 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
      <nav aria-label="Breadcrumb" class="mb-8">
        <ol role="list" class="flex items-center space-x-4">
          <li>
            <RouterLink to="/souls/prims" class="text-sm font-medium text-gray-900 hover:text-indigo-600">
              Prims
            </RouterLink>
          </li>
          <li>
            <svg viewBox="0 0 6 20" aria-hidden="true" class="h-5 w-auto text-gray-300">
              <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor" />
            </svg>
          </li>
          <li class="text-sm font-medium text-gray-500">
            {{ persona?.name ?? '…' }}
          </li>
        </ol>
      </nav>

      <p class="text-sm font-medium text-gray-700">Przełącz personę</p>
      <PersonaSwitcher
        v-model="selectedPersonaId"
        class="mt-2"
        @change="onPersonaChange"
      />

      <p v-if="loading" class="mt-10 text-sm text-gray-500">Ładowanie profilu…</p>
      <p v-else-if="error" class="mt-10 text-sm text-red-600">{{ error }}</p>

      <div
        v-else-if="persona"
        class="mt-10 lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16"
      >
        <div class="lg:col-span-4 lg:row-end-1">
          <div
            v-if="avatarUrl"
            class="relative aspect-4/3 w-full overflow-hidden rounded-lg outline -outline-offset-1 outline-black/5"
          >
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div
                class="absolute -inset-[40%] bg-cover bg-center"
                :style="avatarBlurStyle"
              />
            </div>
            <div class="relative flex size-full items-center justify-center">
              <img
                :src="resolvedAvatarUrl"
                :alt="persona.name"
                class="max-h-[95%] max-w-[95%] object-contain object-center"
                draggable="false"
              />
            </div>
          </div>
          <div
            v-else
            class="flex aspect-4/3 w-full items-center justify-center rounded-lg bg-gray-200 text-5xl font-semibold text-gray-600"
          >
            {{ initials(persona.name) }}
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <label
              class="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <input
                ref="photoInputRef"
                type="file"
                accept="image/*"
                class="sr-only"
                :disabled="photoBusy"
                @change="onPhotoSelected"
              />
              {{ photoBusy ? t('souls.prims.photoUploading') : t('souls.prims.uploadPhoto') }}
            </label>
            <button
              v-if="persona.avatar_source_url || persona.avatar_doll_url"
              type="button"
              class="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
              :disabled="photoBusy || !persona.avatar_source_url"
              @click="onGenerateAvatar"
            >
              {{ photoBusy ? t('souls.prims.generating') : t('souls.prims.generateAvatar') }}
            </button>
            <button
              v-if="persona.avatar_source_url || persona.avatar_doll_url"
              type="button"
              class="rounded-md px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              :disabled="photoBusy"
              @click="onClearAvatar"
            >
              {{ t('souls.prims.clearPhoto') }}
            </button>
          </div>
          <p v-if="photoError" class="mt-2 text-sm text-red-600">{{ photoError }}</p>
          <p v-else-if="photoHint" class="mt-2 text-sm text-emerald-700">{{ photoHint }}</p>
        </div>

        <div class="mx-auto mt-10 max-w-2xl sm:mt-14 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {{ persona.name }}
              </h1>
              <p v-if="personaMeta" class="mt-2 text-sm text-gray-500">
                {{ personaMeta }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                @click="openEdit"
              >
                {{ t('souls.prims.edit') }}
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                @click="confirmDelete"
              >
                {{ t('souls.prims.delete') }}
              </button>
            </div>
          </div>

          <form
            v-if="editOpen"
            class="mt-6 space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4"
            @submit.prevent="saveEdit"
          >
            <div>
              <label for="prim-edit-name" class="block text-sm font-medium text-gray-700">
                {{ t('souls.prims.name') }}
              </label>
              <input
                id="prim-edit-name"
                v-model="editForm.name"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label for="prim-edit-gender" class="block text-sm font-medium text-gray-700">
                {{ t('souls.prims.gender') }}
              </label>
              <select
                id="prim-edit-gender"
                v-model="editForm.gender"
                class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">{{ t('souls.prims.genderUnknown') }}</option>
                <option value="female">{{ t('souls.prims.genderFemale') }}</option>
                <option value="male">{{ t('souls.prims.genderMale') }}</option>
              </select>
            </div>
            <div>
              <label for="prim-edit-description" class="block text-sm font-medium text-gray-700">
                {{ t('souls.prims.description') }}
              </label>
              <textarea
                id="prim-edit-description"
                v-model="editForm.description"
                rows="3"
                class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                :disabled="editSaving"
              >
                {{ editSaving ? t('souls.prims.saving') : t('souls.prims.save') }}
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                @click="editOpen = false"
              >
                {{ t('souls.prims.cancel') }}
              </button>
            </div>
            <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
          </form>

          <p v-else-if="persona.description" class="mt-6 text-gray-500">
            {{ persona.description }}
          </p>

          <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <RouterLink
              to="/collection"
              class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
            >
              Kolekcje
            </RouterLink>
            <RouterLink
              to="/souls/prims"
              class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-50 px-8 py-3 text-base font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
            >
              Wszystkie persony
            </RouterLink>
          </div>

          <div v-if="highlights.length" class="mt-10 border-t border-gray-200 pt-10">
            <h3 class="text-sm font-medium text-gray-900">Podsumowanie</h3>
            <ul role="list" class="mt-4 list-disc space-y-1 pl-5 text-sm/6 text-gray-500 marker:text-gray-300">
              <li v-for="highlight in highlights" :key="highlight" class="pl-2">
                {{ highlight }}
              </li>
            </ul>
          </div>

          <div class="mt-10 border-t border-gray-200 pt-10">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-medium text-gray-900">{{ t('outfit.upcoming') }}</h3>
              <RouterLink
                :to="{ path: '/calendar', query: { date: todayKey } }"
                class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                {{ t('outfit.viewCalendar') }}
              </RouterLink>
            </div>
            <ul v-if="upcomingOutfits.length" class="mt-4 space-y-3">
              <li
                v-for="outfit in upcomingOutfits"
                :key="outfit.id"
                class="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <RouterLink
                  :to="{ path: '/calendar', query: { date: wearDateKey(outfit) } }"
                  class="block"
                >
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatOutfitDate(wearDateKey(outfit)) }}
                    <span v-if="outfit.label" class="font-normal text-gray-500">
                      · {{ outfit.label }}
                    </span>
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">
                    {{ t('outfit.itemCount', { count: outfit.items?.length ?? 0 }) }}
                  </p>
                  <div v-if="outfit.items?.length" class="mt-2 flex flex-wrap gap-1.5">
                    <div
                      v-for="item in outfit.items.slice(0, 5)"
                      :key="item.id"
                      class="size-8 overflow-hidden rounded bg-gray-200 ring-1 ring-gray-200"
                      :title="item.name"
                    >
                      <img
                        v-if="itemImageSrc(item)"
                        :src="itemImageSrc(item)"
                        :alt="item.name"
                        class="size-full object-cover"
                      />
                    </div>
                  </div>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="mt-4 text-sm text-gray-500">
              {{ t('outfit.upcomingEmpty') }}
            </p>
          </div>

          <div class="mt-10 border-t border-gray-200 pt-10">
            <h3 class="text-sm font-medium text-gray-900">Dopasowanie itemów</h3>
            <p class="mt-4 text-sm text-gray-500">
              Itemy nie należą do jednej persony — poniżej widzisz przedmioty, które mogą pasować do
              {{ persona.name }}, w tym wspólne dla wszystkich person (sugestia stylu, nie własność).
            </p>
          </div>
        </div>

        <div class="mx-auto mt-12 w-full max-w-2xl lg:col-span-7 lg:mt-16 lg:max-w-none">
          <TabGroup as="div">
            <div class="flex flex-col gap-4 border-b border-gray-200 sm:flex-row sm:items-end sm:justify-between">
              <TabList class="-mb-px flex min-w-0 flex-1 space-x-8 overflow-x-auto">
                <Tab v-slot="{ selected }" as="template">
                  <button
                    type="button"
                    :class="[
                      selected
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800',
                      'border-b-2 py-6 text-sm font-medium whitespace-nowrap',
                    ]"
                  >
                    Itemy
                    <span v-if="filteredPersonaItems.length" class="ml-1.5 text-gray-400">
                      ({{ filteredPersonaItems.length }}{{ collectionFilter ? ` / ${personaItems.length}` : '' }})
                    </span>
                  </button>
                </Tab>
                <Tab v-slot="{ selected }" as="template">
                  <button
                    type="button"
                    :class="[
                      selected
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800',
                      'border-b-2 py-6 text-sm font-medium whitespace-nowrap',
                    ]"
                  >
                    Kolekcje
                  </button>
                </Tab>
                <Tab v-slot="{ selected }" as="template">
                  <button
                    type="button"
                    :class="[
                      selected
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800',
                      'border-b-2 py-6 text-sm font-medium whitespace-nowrap',
                    ]"
                  >
                    Profil
                  </button>
                </Tab>
              </TabList>

              <div class="flex shrink-0 items-center gap-2 pb-4 sm:pb-6">
                <label for="persona-collection-filter" class="text-sm font-medium text-gray-700">
                  Filter
                </label>
                <select
                  id="persona-collection-filter"
                  v-model="collectionFilter"
                  class="block min-w-[11rem] rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Wszystkie kolekcje</option>
                  <option
                    v-for="option in collectionFilterOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }} ({{ option.count }})
                  </option>
                </select>
              </div>
            </div>

            <TabPanels>
              <TabPanel class="pt-8">
                <h3 class="sr-only">Itemy pasujące do persony</h3>

                <p v-if="!filteredPersonaItems.length" class="text-sm text-gray-500">
                  {{
                    collectionFilter
                      ? 'Brak itemów w wybranej kolekcji.'
                      : 'Brak pasujących itemów.'
                  }}
                </p>

                <div
                  v-else
                  class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                >
                  <div
                    v-for="item in filteredPersonaItems"
                    :key="item.id"
                    class="group relative rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md"
                  >
                    <RouterLink v-if="itemLink(item)" :to="itemLink(item)" class="block">
                      <ItemImage
                        :src="itemImageSrc(item)"
                        :alt="item.name"
                        container-class="aspect-square w-full rounded-md bg-gray-100"
                        normalize-scale
                      />
                      <p class="mt-3 text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                        {{ item.name }}
                      </p>
                      <p v-if="item.collection_group?.name" class="mt-1 text-xs text-gray-500">
                        {{ item.collection_group.name }}
                      </p>
                      <p v-if="itemPersonaHint(item)" class="mt-1 text-xs text-indigo-600">
                        {{ itemPersonaHint(item) }}
                      </p>
                    </RouterLink>
                    <div v-else>
                      <ItemImage
                        :src="itemImageSrc(item)"
                        :alt="item.name"
                        container-class="aspect-square w-full rounded-md bg-gray-100"
                        normalize-scale
                      />
                      <p class="mt-3 text-sm font-medium text-gray-900">{{ item.name }}</p>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel class="pt-8">
                <h3 class="sr-only">Kolekcje</h3>

                <p v-if="!filteredItemsByCollection.length" class="text-sm text-gray-500">
                  {{
                    collectionFilter
                      ? 'Brak itemów w wybranej kolekcji.'
                      : 'Brak itemów w kolekcjach.'
                  }}
                </p>

                <dl v-else class="divide-y divide-gray-200">
                  <div
                    v-for="group in filteredItemsByCollection"
                    :key="group.id ?? group.name"
                    class="py-6"
                  >
                    <dt class="font-medium text-gray-900">
                      {{ group.name }}
                      <span class="ml-2 text-sm font-normal text-gray-500">
                        {{ group.items.length }}
                        {{ group.items.length === 1 ? 'item' : 'itemów' }}
                      </span>
                    </dt>
                    <dd class="mt-3">
                      <ul role="list" class="space-y-2">
                        <li
                          v-for="item in group.items"
                          :key="item.id"
                          class="flex items-center justify-between gap-4 text-sm"
                        >
                          <span class="text-gray-700">{{ item.name }}</span>
                          <RouterLink
                            v-if="itemLink(item)"
                            :to="itemLink(item)"
                            class="shrink-0 font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Otwórz
                          </RouterLink>
                        </li>
                      </ul>
                    </dd>
                  </div>
                </dl>
              </TabPanel>

              <TabPanel class="pt-8">
                <h3 class="sr-only">Profil persony</h3>

                <dl class="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div v-if="persona.type">
                    <dt class="text-sm font-medium text-gray-500">Typ</dt>
                    <dd class="mt-1 text-sm capitalize text-gray-900">{{ persona.type }}</dd>
                  </div>
                  <div v-if="persona.gender">
                    <dt class="text-sm font-medium text-gray-500">Płeć</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ genderLabel(persona.gender) }}</dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500">Opis</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      {{ persona.description || '—' }}
                    </dd>
                  </div>
                </dl>

                <div class="mt-10 border-t border-gray-200 pt-10">
                  <h3 class="text-base font-semibold text-gray-900">Pomiary ciała</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    Wzrost, waga, kolor skóry i obwody — zapisuj kolejne wpisy, aby śledzić zmiany w czasie.
                  </p>
                  <PersonaBodyProfile :entity-id="persona.id" class="mt-6" />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="deleteOpen"
      :title="t('souls.prims.deleteConfirmTitle')"
      :message="t('souls.prims.deleteConfirmBody', { name: persona?.name ?? '' })"
      :confirm-label="t('souls.prims.delete')"
      variant="danger"
      :loading="deleteBusy"
      @close="deleteOpen = false"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import PersonaSwitcher from './PersonaSwitcher.vue'
import PersonaBodyProfile from './PersonaBodyProfile.vue'
import ItemImage from './ItemImage.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import { isDefaultPersonaFit } from '../constants/itemPersonaFit'
import {
  clearPersonaAvatar,
  generatePersonaAvatar,
  uploadPersonaPhoto,
} from '../services/personaImageProcessing'
import { usePersonasStore } from '../stores/personas'
import { useOutfitsStore, wearDateKey } from '../stores/outfits'
import { addDaysToDateKey, formatEventDate, toDateKey } from '../utils/calendarGrid'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()
const router = useRouter()
const personasStore = usePersonasStore()
const outfitsStore = useOutfitsStore()

const todayKey = toDateKey(new Date())

const persona = ref(null)
const loading = ref(false)
const error = ref(null)
const selectedPersonaId = ref(null)
const collectionFilter = ref('')

const editOpen = ref(false)
const editSaving = ref(false)
const editError = ref('')
const editForm = reactive({
  name: '',
  gender: '',
  description: '',
})

const photoInputRef = ref(null)
const photoBusy = ref(false)
const photoError = ref('')
const photoHint = ref('')
const deleteOpen = ref(false)
const deleteBusy = ref(false)

const avatarUrl = computed(() => {
  if (!persona.value) return null
  return (
    persona.value.avatar_doll_url ??
    persona.value.avatar_source_url ??
    persona.value.avatar_url ??
    personasStore.personas.find((p) => p.id === persona.value.id)?.imageUrl ??
    null
  )
})

const resolvedAvatarUrl = computed(
  () => resolveStorageUrl(avatarUrl.value) ?? avatarUrl.value
)

const avatarBlurStyle = computed(() => {
  const radialMask =
    'radial-gradient(ellipse 78% 78% at 50% 50%, #000 18%, rgba(0,0,0,0.55) 42%, transparent 70%)'

  return {
    backgroundImage: resolvedAvatarUrl.value
      ? `url(${resolvedAvatarUrl.value})`
      : undefined,
    filter: 'blur(64px) saturate(1.1)',
    transform: 'scale(1.2)',
    WebkitMaskImage: radialMask,
    maskImage: radialMask,
  }
})

const personaItems = computed(() => persona.value?.items ?? [])

const upcomingOutfits = computed(() => {
  if (!persona.value?.id) return []
  const from = todayKey
  const to = addDaysToDateKey(from, 7)
  return outfitsStore.outfits
    .filter((outfit) => {
      if (Number(outfit.entity_id) !== Number(persona.value.id)) return false
      const key = wearDateKey(outfit)
      return key >= from && key <= to
    })
    .slice()
    .sort((a, b) => wearDateKey(a).localeCompare(wearDateKey(b)))
})

function formatOutfitDate(dateKey) {
  return formatEventDate(dateKey)
}

const collectionFilterOptions = computed(() => {
  const map = new Map()

  for (const item of personaItems.value) {
    const value = item.category_id ? String(item.category_id) : '__none__'
    const label = item.collection_group?.name ?? 'Bez kolekcji'

    if (!map.has(value)) {
      map.set(value, { value, label, count: 0 })
    }
    map.get(value).count += 1
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'pl'))
})

const filteredPersonaItems = computed(() => {
  if (!collectionFilter.value) return personaItems.value

  return personaItems.value.filter((item) => {
    const value = item.category_id ? String(item.category_id) : '__none__'
    return value === collectionFilter.value
  })
})

const personaMeta = computed(() => {
  if (!persona.value) return null
  const parts = []
  if (persona.value.type) parts.push(persona.value.type)
  if (persona.value.gender) parts.push(genderLabel(persona.value.gender))
  if (personaItems.value.length) {
    parts.push(`${personaItems.value.length} pasujących itemów`)
  }
  return parts.length ? parts.join(' · ') : null
})

const highlights = computed(() => {
  if (!persona.value) return []
  const items = personaItems.value
  const lines = [`${items.length} itemów pasuje do tej persony`]

  const defaultCount = items.filter((item) =>
    isDefaultPersonaFit(item, persona.value.id)
  ).length
  if (defaultCount) {
    lines.push(`${defaultCount} z domyślnym dopasowaniem do ${persona.value.name}`)
  }

  const sharedCount = items.filter((item) => item.fits_all_personas).length
  if (sharedCount) {
    lines.push(`${sharedCount} wspólnych dla wszystkich person`)
  }

  const collections = new Set(
    items.map((item) => item.collection_group?.name).filter(Boolean)
  )
  if (collections.size) {
    lines.push(`${collections.size} kolekcji z pasującymi itemami`)
  }

  return lines
})

const itemsByCollection = computed(() => {
  const groups = new Map()

  for (const item of personaItems.value) {
    const name = item.collection_group?.name ?? 'Bez kolekcji'
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(item)
  }

  return [...groups.entries()]
    .map(([name, items]) => ({
      id: items[0]?.category_id ? String(items[0].category_id) : '__none__',
      name,
      items,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})

const filteredItemsByCollection = computed(() => {
  if (!collectionFilter.value) return itemsByCollection.value

  return itemsByCollection.value.filter((group) => group.id === collectionFilter.value)
})

function itemImageSrc(item) {
  const first = item.images?.[0]
  return resolveStorageUrl(first?.url ?? item.image_url) ?? null
}

function itemPersonaHint(item) {
  if (!persona.value || !item) return null

  if (item.fits_all_personas && isDefaultPersonaFit(item, persona.value.id)) {
    return 'Domyślne dopasowanie'
  }

  if (item.fits_all_personas) {
    return 'Pasuje do wszystkich'
  }

  return null
}

function itemLink(item) {
  if (!item?.category_id) return null

  return {
    name: 'item-overview',
    params: {
      name: item.collection_group?.name ?? 'collection',
      item_name: String(item.id),
    },
    query: { groupId: String(item.category_id) },
  }
}

function genderLabel(gender) {
  if (gender === 'female') return t('souls.prims.genderFemale')
  if (gender === 'male') return t('souls.prims.genderMale')
  return gender
}

function openEdit() {
  if (!persona.value) return
  editForm.name = persona.value.name ?? ''
  editForm.gender = persona.value.gender ?? ''
  editForm.description = persona.value.description ?? ''
  editError.value = ''
  editOpen.value = true
}

async function saveEdit() {
  if (!persona.value) return
  editSaving.value = true
  editError.value = ''
  try {
    await personasStore.updateSoul(persona.value.id, {
      name: editForm.name,
      gender: editForm.gender || null,
      description: editForm.description,
    })
    editOpen.value = false
    await loadPersona(props.id)
  } catch (err) {
    editError.value = err?.message || t('souls.prims.saveError')
  } finally {
    editSaving.value = false
  }
}

function confirmDelete() {
  deleteOpen.value = true
}

async function onDeleteConfirm() {
  if (!persona.value) return
  deleteBusy.value = true
  try {
    await personasStore.deleteSoul(persona.value.id)
    deleteOpen.value = false
    router.push({ name: 'SoulsPrims' })
  } catch (err) {
    error.value = err?.message || t('souls.prims.deleteError')
    deleteOpen.value = false
  } finally {
    deleteBusy.value = false
  }
}

async function onPhotoSelected(event) {
  const file = event.target?.files?.[0]
  if (photoInputRef.value) photoInputRef.value.value = ''
  if (!file || !persona.value) return

  photoBusy.value = true
  photoError.value = ''
  photoHint.value = ''
  try {
    const result = await uploadPersonaPhoto(persona.value.id, file)
    persona.value = {
      ...persona.value,
      avatar_source_url: result.avatar_source_url,
      avatar_doll_url: result.avatar_doll_url ?? persona.value.avatar_doll_url,
    }
    await personasStore.fetchPersonas()
    photoHint.value = t('souls.prims.photoUploaded')
  } catch (err) {
    photoError.value = err?.message || t('souls.prims.photoError')
  } finally {
    photoBusy.value = false
  }
}

async function onGenerateAvatar() {
  if (!persona.value?.avatar_source_url) return
  photoBusy.value = true
  photoError.value = ''
  photoHint.value = ''
  try {
    const result = await generatePersonaAvatar(persona.value.id, persona.value.avatar_source_url)
    persona.value = {
      ...persona.value,
      avatar_source_url: result.avatar_source_url ?? persona.value.avatar_source_url,
      avatar_doll_url: result.avatar_doll_url ?? result.output_url ?? persona.value.avatar_doll_url,
    }
    await personasStore.fetchPersonas()
    photoHint.value = t('souls.prims.avatarGenerated')
  } catch (err) {
    photoError.value = err?.message || t('souls.prims.generateError')
  } finally {
    photoBusy.value = false
  }
}

async function onClearAvatar() {
  if (!persona.value) return
  photoBusy.value = true
  photoError.value = ''
  photoHint.value = ''
  try {
    await clearPersonaAvatar(persona.value.id)
    persona.value = {
      ...persona.value,
      avatar_source_url: null,
      avatar_doll_url: null,
    }
    await personasStore.fetchPersonas()
  } catch (err) {
    photoError.value = err?.message || t('souls.prims.photoError')
  } finally {
    photoBusy.value = false
  }
}

async function loadPersona(id) {
  loading.value = true
  error.value = null

  try {
    await personasStore.fetchPersonas().catch(() => {})
    persona.value = await personasStore.fetchPersona(id)
    selectedPersonaId.value = Number(id)
    personasStore.setActivePersona(id)
    const from = toDateKey(new Date())
    const to = addDaysToDateKey(from, 7)
    await outfitsStore
      .fetchOutfits({ from, to, entity_id: id })
      .catch(() => {})
  } catch (err) {
    error.value = err.message
    persona.value = null
  } finally {
    loading.value = false
  }
}

function onPersonaChange(newId) {
  if (String(newId) === String(props.id)) return
  router.push({
    name: 'PrimOverview',
    params: { id: String(newId) },
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

watch(
  () => props.id,
  (id) => {
    collectionFilter.value = ''
    if (id) loadPersona(id)
  },
  { immediate: true }
)
</script>
