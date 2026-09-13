<template>
  <div class="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">
          {{ t('nav.style') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('style.subtitle') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          to="/calendar"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {{ t('outfit.viewCalendar') }}
        </RouterLink>
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          @click="openCreate()"
        >
          {{ t('outfit.add') }}
        </button>
      </div>
    </div>

    <p v-if="outfitsStore.error" class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
      {{ outfitsStore.error }}
    </p>

    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
      <!-- Left: Prim preview -->
      <aside class="lg:col-span-2">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ t('outfit.prim') }}
          </p>
          <PersonaSwitcher
            v-model="selectedPrimId"
            class="mt-3"
          />

          <div class="relative mt-6 overflow-hidden rounded-xl bg-gray-100">
            <div
              v-if="resolvedAvatarUrl"
              class="pointer-events-none absolute inset-0 opacity-70"
              :style="avatarBlurStyle"
              aria-hidden="true"
            />
            <div class="relative flex aspect-3/4 items-center justify-center p-4">
              <img
                v-if="resolvedAvatarUrl"
                :src="resolvedAvatarUrl"
                :alt="selectedPrim?.name ?? ''"
                class="max-h-full max-w-full object-contain drop-shadow-md"
              />
              <div
                v-else
                class="flex size-28 items-center justify-center rounded-full bg-gray-200 text-3xl font-semibold text-gray-600"
              >
                {{ primInitials }}
              </div>
            </div>
          </div>

          <div class="mt-4">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ selectedPrim?.name ?? t('style.noPrim') }}
            </h2>
            <p v-if="selectedPrim?.description" class="mt-1 line-clamp-3 text-sm text-gray-500">
              {{ selectedPrim.description }}
            </p>
            <RouterLink
              v-if="selectedPrim"
              :to="`/souls/prims/${selectedPrim.id}`"
              class="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {{ t('style.openPrim') }}
            </RouterLink>
          </div>
        </div>
      </aside>

      <!-- Right: occasion tiles + outfits -->
      <section class="lg:col-span-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-gray-900">
            {{ t('style.occasionsTitle') }}
          </h2>
          <button
            v-if="activeOccasion"
            type="button"
            class="text-xs font-medium text-gray-500 hover:text-gray-800"
            @click="activeOccasion = ''"
          >
            {{ t('style.clearOccasion') }}
          </button>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="occ in OUTFIT_OCCASIONS"
            :key="occ.value"
            type="button"
            :class="[
              'rounded-xl border p-4 text-left transition',
              activeOccasion === occ.value
                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
            ]"
            @click="toggleOccasion(occ.value)"
          >
            <component
              :is="occasionIcon(occ.icon)"
              class="size-6 text-gray-700"
              aria-hidden="true"
            />
            <p class="mt-3 text-sm font-semibold text-gray-900">
              {{ t(occ.labelKey) }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              {{ t('outfit.outfitCount', { count: countForOccasion(occ.value) }) }}
            </p>
          </button>
        </div>

        <div class="mt-8">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-900">
              {{
                activeOccasion
                  ? t(outfitOccasionMeta(activeOccasion)?.labelKey ?? 'outfit.titlePlural')
                  : t('outfit.titlePlural')
              }}
            </h3>
            <button
              type="button"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              :disabled="!selectedPrim"
              @click="openCreate(activeOccasion || undefined)"
            >
              + {{ t('outfit.add') }}
            </button>
          </div>

          <p v-if="outfitsStore.loading" class="mt-4 text-sm text-gray-500">
            {{ t('common.loading') }}
          </p>
          <p v-else-if="!selectedPrim" class="mt-4 text-sm text-gray-500">
            {{ t('style.pickPrim') }}
          </p>
          <ul v-else-if="visibleOutfits.length" class="mt-4 space-y-3">
            <li
              v-for="outfit in visibleOutfits"
              :key="outfit.id"
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatEventDate(wearDateKey(outfit)) }}
                    <span
                      v-if="outfit.occasion"
                      class="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                    >
                      {{ t(outfitOccasionMeta(outfit.occasion)?.labelKey ?? 'outfit.occasion') }}
                    </span>
                  </p>
                  <p v-if="outfit.label" class="mt-0.5 text-xs text-gray-500">
                    {{ outfit.label }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ t('outfit.itemCount', { count: outfit.items?.length ?? 0 }) }}
                  </p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button
                    type="button"
                    class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    @click="openEdit(outfit)"
                  >
                    {{ t('outfit.edit') }}
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-gray-500 hover:text-gray-800"
                    @click="requestRemove(outfit)"
                  >
                    {{ t('outfit.delete') }}
                  </button>
                </div>
              </div>
              <div v-if="outfit.items?.length" class="mt-3 flex flex-wrap gap-1.5">
                <div
                  v-for="item in outfit.items.slice(0, 8)"
                  :key="item.id"
                  class="size-10 overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200"
                  :title="item.name"
                >
                  <img
                    v-if="itemThumb(item)"
                    :src="itemThumb(item)"
                    :alt="item.name"
                    class="size-full object-cover"
                  />
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-gray-500">
            {{ activeOccasion ? t('style.emptyOccasion') : t('style.empty') }}
          </p>
        </div>
      </section>
    </div>

    <OutfitFormModal
      :open="formOpen"
      :editing-id="editingId"
      :saving="saving"
      :form-error="formError"
      :form="form"
      :prims="prims"
      :items="collectionItems"
      @close="closeForm"
      @submit="submitForm"
    />

    <ConfirmDialog
      :open="deleteOpen"
      :title="t('outfit.delete')"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      :loading="deleting"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AcademicCapIcon,
  BriefcaseIcon,
  BoltIcon,
  GlobeAltIcon,
  HomeIcon,
  MapIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import OutfitFormModal from '../components/outfit/OutfitFormModal.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import {
  OUTFIT_OCCASIONS,
  outfitOccasionMeta,
} from '../constants/outfitOccasions'
import { useCollectionStore } from '../stores/collection'
import { useOutfitsStore, wearDateKey } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'
import { formatEventDate, toDateKey } from '../utils/calendarGrid'

const ICON_MAP = {
  academic: AcademicCapIcon,
  briefcase: BriefcaseIcon,
  home: HomeIcon,
  map: MapIcon,
  sparkles: SparklesIcon,
  bolt: BoltIcon,
  star: StarIcon,
  sun: SunIcon,
  globe: GlobeAltIcon,
}

const { t } = useI18n()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()
const collectionStore = useCollectionStore()

const selectedPrimId = ref(null)
const activeOccasion = ref('')
const formOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const emptyForm = () => ({
  entity_id: '',
  wear_date: toDateKey(new Date()),
  label: '',
  occasion: '',
  notes: '',
  item_ids: [],
})

const form = reactive(emptyForm())

const prims = computed(() => personasStore.prims)
const collectionItems = computed(() => collectionStore.allItemsList)

const selectedPrim = computed(() => {
  const id = selectedPrimId.value ?? personasStore.activePersonaId
  if (!id) return personasStore.activePrim ?? prims.value[0] ?? null
  return (
    prims.value.find((p) => String(p.id) === String(id)) ??
    personasStore.activePrim ??
    null
  )
})

const avatarUrl = computed(() => {
  const p = selectedPrim.value
  if (!p) return null
  return p.avatar_doll_url ?? p.avatar_source_url ?? p.imageUrl ?? p.avatar_url ?? null
})

const resolvedAvatarUrl = computed(
  () => resolveStorageUrl(avatarUrl.value) ?? avatarUrl.value,
)

const avatarBlurStyle = computed(() => {
  const radialMask =
    'radial-gradient(ellipse 78% 78% at 50% 50%, #000 18%, rgba(0,0,0,0.55) 42%, transparent 70%)'
  return {
    backgroundImage: resolvedAvatarUrl.value
      ? `url(${resolvedAvatarUrl.value})`
      : undefined,
    filter: 'blur(48px) saturate(1.05)',
    transform: 'scale(1.15)',
    WebkitMaskImage: radialMask,
    maskImage: radialMask,
  }
})

const primInitials = computed(() => {
  const name = selectedPrim.value?.name ?? ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

const primOutfits = computed(() => {
  const id = selectedPrim.value?.id
  if (!id) return []
  return outfitsStore.outfits
    .filter((o) => Number(o.entity_id) === Number(id))
    .slice()
    .sort((a, b) => wearDateKey(a).localeCompare(wearDateKey(b)))
})

const visibleOutfits = computed(() => {
  if (!activeOccasion.value) return primOutfits.value
  return primOutfits.value.filter((o) => o.occasion === activeOccasion.value)
})

const deleteMessage = computed(() => {
  const outfit = deleteTarget.value
  if (!outfit) return ''
  return t('outfit.deleteConfirm', {
    prim: outfit.entity?.name ?? t('outfit.prim'),
    date: formatEventDate(wearDateKey(outfit)),
  })
})

function occasionIcon(key) {
  return ICON_MAP[key] ?? SparklesIcon
}

function countForOccasion(value) {
  return primOutfits.value.filter((o) => o.occasion === value).length
}

function toggleOccasion(value) {
  activeOccasion.value = activeOccasion.value === value ? '' : value
}

function itemThumb(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

async function loadOutfits() {
  const params = {}
  if (selectedPrim.value?.id) params.entity_id = selectedPrim.value.id
  await outfitsStore.fetchOutfits(params)
}

function resetForm(occasion) {
  Object.assign(form, emptyForm())
  form.wear_date = toDateKey(new Date())
  form.occasion = occasion || activeOccasion.value || ''
  if (selectedPrim.value) {
    form.entity_id = String(selectedPrim.value.id)
  } else if (prims.value[0]) {
    form.entity_id = String(prims.value[0].id)
  }
}

async function ensureFormData() {
  const jobs = []
  if (!personasStore.personas.length) jobs.push(personasStore.fetchPersonas())
  if (!collectionStore.allItemsList.length) jobs.push(collectionStore.fetchAllItems())
  if (jobs.length) await Promise.all(jobs)
}

function openCreate(occasion) {
  editingId.value = null
  formError.value = ''
  resetForm(occasion)
  formOpen.value = true
  ensureFormData().catch(() => {})
}

function openEdit(outfit) {
  editingId.value = outfit.id
  formError.value = ''
  Object.assign(form, {
    entity_id: String(outfit.entity_id ?? outfit.entity?.id ?? ''),
    wear_date: wearDateKey(outfit),
    label: outfit.label ?? '',
    occasion: outfit.occasion ?? '',
    notes: outfit.notes ?? '',
    item_ids: (outfit.items ?? []).map((item) => item.id),
  })
  formOpen.value = true
  ensureFormData().catch(() => {})
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
  formError.value = ''
}

async function submitForm() {
  if (!form.entity_id || !form.wear_date) {
    formError.value = t('outfit.primPlaceholder')
    return
  }
  saving.value = true
  formError.value = ''
  const payload = {
    entity_id: Number(form.entity_id),
    wear_date: form.wear_date,
    label: form.label?.trim() || null,
    occasion: form.occasion || null,
    notes: form.notes?.trim() || null,
    item_ids: (form.item_ids ?? []).map((id) => Number(id)),
    source: 'manual',
  }
  try {
    if (editingId.value) {
      await outfitsStore.updateOutfit(editingId.value, payload)
    } else {
      await outfitsStore.createOutfit(payload)
    }
    closeForm()
    await loadOutfits().catch(() => {})
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

function requestRemove(outfit) {
  deleteTarget.value = outfit
  deleteOpen.value = true
}

async function confirmDelete() {
  const outfit = deleteTarget.value
  if (!outfit || deleting.value) return
  deleting.value = true
  try {
    await outfitsStore.deleteOutfit(outfit.id)
    deleteOpen.value = false
    deleteTarget.value = null
  } catch (err) {
    formError.value = err.message
  } finally {
    deleting.value = false
  }
}

watch(selectedPrimId, (id) => {
  if (id != null) personasStore.setActivePersona(id)
  loadOutfits().catch(() => {})
})

onMounted(async () => {
  await personasStore.fetchPersonas().catch(() => {})
  selectedPrimId.value =
    personasStore.activePrim?.id ?? personasStore.prims[0]?.id ?? null
  await loadOutfits().catch(() => {})
})
</script>
