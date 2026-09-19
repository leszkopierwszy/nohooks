<template>
  <div class="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
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

    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- Left: Prim silhouette (Comfy doll from user photo) -->
      <aside class="lg:col-span-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ t('outfit.prim') }}
          </p>
          <PersonaSwitcher
            v-model="selectedPrimId"
            class="mt-3"
          />

          <div class="relative mt-6 overflow-hidden rounded-xl bg-linear-to-b from-gray-50 to-gray-100">
            <div
              v-if="silhouetteUrl"
              class="pointer-events-none absolute inset-0 opacity-50"
              :style="silhouetteBlurStyle"
              aria-hidden="true"
            />

            <div class="relative flex min-h-88 aspect-3/4 flex-col items-center justify-center p-4">
              <img
                v-if="silhouetteUrl"
                :src="silhouetteUrl"
                :alt="selectedPrim?.name ?? ''"
                :class="[
                  'max-h-full max-w-full object-contain drop-shadow-lg',
                  hasDoll ? '' : 'opacity-40 grayscale',
                ]"
              />
              <div
                v-else
                class="flex flex-col items-center gap-3 px-4 text-center"
              >
                <div
                  class="flex size-24 items-center justify-center rounded-full bg-gray-200 text-3xl font-semibold text-gray-600"
                >
                  {{ primInitials }}
                </div>
                <p class="text-sm text-gray-500">
                  {{ t('style.silhouetteEmpty') }}
                </p>
              </div>

              <div
                v-if="selectedPrim && !hasDoll"
                class="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 p-3 text-center shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm"
              >
                <p class="text-xs text-gray-600">
                  {{
                    hasSource
                      ? t('style.silhouetteNeedGenerate')
                      : t('style.silhouetteNeedPhoto')
                  }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ selectedPrim?.name ?? t('style.noPrim') }}
                </h2>
                <p class="mt-0.5 text-xs text-gray-500">
                  {{
                    hasDoll
                      ? t('style.silhouetteReady')
                      : hasSource
                        ? t('style.silhouetteSourceOnly')
                        : t('style.silhouetteMissing')
                  }}
                </p>
              </div>
              <RouterLink
                v-if="selectedPrim"
                :to="`/souls/prims/${selectedPrim.id}`"
                class="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                {{ t('style.openPrim') }}
              </RouterLink>
            </div>

            <div v-if="selectedPrim" class="mt-4 flex flex-wrap gap-2">
              <label
                class="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-60"
                :class="silhouetteBusy ? 'pointer-events-none opacity-60' : ''"
              >
                <input
                  ref="photoInputRef"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  :disabled="silhouetteBusy"
                  @change="onPhotoSelected"
                />
                {{
                  silhouetteBusy && silhouetteAction === 'upload'
                    ? t('souls.prims.photoUploading')
                    : t('style.uploadPhoto')
                }}
              </label>
              <button
                v-if="hasSource || hasDoll"
                type="button"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                :disabled="silhouetteBusy || !hasSource"
                @click="onGenerateSilhouette"
              >
                {{
                  silhouetteBusy && silhouetteAction === 'generate'
                    ? t('souls.prims.generating')
                    : hasDoll
                      ? t('style.regenerateSilhouette')
                      : t('style.generateSilhouette')
                }}
              </button>
            </div>
            <p v-if="silhouetteError" class="mt-2 text-sm text-red-600">{{ silhouetteError }}</p>
            <p v-else-if="silhouetteHint" class="mt-2 text-sm text-emerald-700">{{ silhouetteHint }}</p>
          </div>
        </div>
      </aside>

      <!-- Right: occasion tiles + outfits -->
      <section class="lg:col-span-8">
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
          <ul
            v-else-if="visibleOutfits.length"
            class="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-2"
          >
            <li
              v-for="outfit in visibleOutfits"
              :key="outfit.id"
              class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div class="flex items-start justify-between gap-3 px-5 pt-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900">
                    {{ formatEventDate(wearDateKey(outfit)) }}
                  </p>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      v-if="outfit.occasion"
                      class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                    >
                      {{ t(outfitOccasionMeta(outfit.occasion)?.labelKey ?? 'outfit.occasion') }}
                    </span>
                    <span v-if="outfit.label" class="text-xs text-gray-500">
                      {{ outfit.label }}
                    </span>
                  </div>
                </div>
              </div>

              <OutfitFlatLay
                v-if="outfit.items?.length"
                class="mt-3 shrink-0"
                :items="outfit.items"
              />
              <p
                v-else
                class="mt-4 px-5 pb-5 text-sm text-gray-500"
              >
                {{ t('outfit.itemCount', { count: 0 }) }}
              </p>

              <div
                class="mt-auto flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 bg-white px-4 py-3"
              >
                <button
                  type="button"
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  @click="openEdit(outfit)"
                >
                  {{ t('outfit.edit') }}
                </button>
                <button
                  type="button"
                  class="text-sm font-medium text-gray-500 hover:text-gray-800"
                  @click="requestRemove(outfit)"
                >
                  {{ t('outfit.delete') }}
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-gray-500">
            {{ activeOccasion ? t('style.emptyOccasion') : t('style.empty') }}
          </p>
        </div>
      </section>
    </div>

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
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
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
import OutfitFlatLay from '../components/outfit/OutfitFlatLay.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import {
  OUTFIT_OCCASIONS,
  outfitOccasionMeta,
} from '../constants/outfitOccasions'
import {
  generatePersonaAvatar,
  uploadPersonaPhoto,
} from '../services/personaImageProcessing'
import { useOutfitsStore, wearDateKey } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'
import { formatEventDate } from '../utils/calendarGrid'

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
const router = useRouter()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()

const selectedPrimId = ref(null)
const activeOccasion = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const formError = ref('')

const photoInputRef = ref(null)
const silhouetteBusy = ref(false)
const silhouetteAction = ref('')
const silhouetteError = ref('')
const silhouetteHint = ref('')

const prims = computed(() => personasStore.prims)

const selectedPrim = computed(() => {
  const id = selectedPrimId.value ?? personasStore.activePersonaId
  if (!id) return personasStore.activePrim ?? prims.value[0] ?? null
  return (
    prims.value.find((p) => String(p.id) === String(id)) ??
    personasStore.activePrim ??
    null
  )
})

const hasDoll = computed(() => Boolean(selectedPrim.value?.avatar_doll_url))
const hasSource = computed(() => Boolean(selectedPrim.value?.avatar_source_url))

/** Prefer Comfy doll silhouette; source photo only as fallback preview. */
const silhouetteUrl = computed(() => {
  const p = selectedPrim.value
  if (!p) return null
  const raw = p.avatar_doll_url ?? p.avatar_source_url ?? null
  return resolveStorageUrl(raw) ?? raw
})

const silhouetteBlurStyle = computed(() => {
  const radialMask =
    'radial-gradient(ellipse 78% 78% at 50% 50%, #000 18%, rgba(0,0,0,0.55) 42%, transparent 70%)'
  return {
    backgroundImage: silhouetteUrl.value ? `url(${silhouetteUrl.value})` : undefined,
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

async function patchSelectedPrim(patch) {
  const id = selectedPrim.value?.id
  if (!id) return
  await personasStore.fetchPersonas().catch(() => {})
  const updated = personasStore.prims.find((p) => Number(p.id) === Number(id))
  if (updated && patch) {
    Object.assign(updated, patch)
  }
}

async function onPhotoSelected(event) {
  const file = event.target?.files?.[0]
  if (photoInputRef.value) photoInputRef.value.value = ''
  if (!file || !selectedPrim.value) return

  silhouetteBusy.value = true
  silhouetteAction.value = 'upload'
  silhouetteError.value = ''
  silhouetteHint.value = ''
  try {
    const result = await uploadPersonaPhoto(selectedPrim.value.id, file)
    await patchSelectedPrim({
      avatar_source_url: result.avatar_source_url,
      avatar_doll_url: result.avatar_doll_url ?? selectedPrim.value.avatar_doll_url,
      imageUrl:
        result.avatar_doll_url ??
        result.avatar_source_url ??
        selectedPrim.value.imageUrl,
    })
    silhouetteHint.value = t('style.photoUploaded')
  } catch (err) {
    silhouetteError.value = err?.message || t('souls.prims.photoError')
  } finally {
    silhouetteBusy.value = false
    silhouetteAction.value = ''
  }
}

async function onGenerateSilhouette() {
  if (!selectedPrim.value?.avatar_source_url) return

  silhouetteBusy.value = true
  silhouetteAction.value = 'generate'
  silhouetteError.value = ''
  silhouetteHint.value = ''
  try {
    const result = await generatePersonaAvatar(selectedPrim.value.id, null)
    await patchSelectedPrim({
      avatar_source_url: result.avatar_source_url ?? selectedPrim.value.avatar_source_url,
      avatar_doll_url:
        result.avatar_doll_url ?? result.output_url ?? selectedPrim.value.avatar_doll_url,
      imageUrl:
        result.avatar_doll_url ??
        result.output_url ??
        selectedPrim.value.imageUrl,
    })
    silhouetteHint.value = t('style.silhouetteGenerated')
  } catch (err) {
    silhouetteError.value = err?.message || t('souls.prims.generateError')
  } finally {
    silhouetteBusy.value = false
    silhouetteAction.value = ''
  }
}

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

async function loadOutfits() {
  const params = {}
  if (selectedPrim.value?.id) params.entity_id = selectedPrim.value.id
  await outfitsStore.fetchOutfits(params)
}

function openCreate(occasion) {
  const query = {}
  if (occasion) query.occasion = occasion
  if (selectedPrim.value?.id) query.entity_id = String(selectedPrim.value.id)
  router.push({ name: 'StyleOutfitCreate', query })
}

function openEdit(outfit) {
  router.push({
    name: 'StyleOutfitEdit',
    params: { id: String(outfit.id) },
  })
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
  silhouetteError.value = ''
  silhouetteHint.value = ''
  loadOutfits().catch(() => {})
})

onMounted(async () => {
  await personasStore.fetchPersonas().catch(() => {})
  selectedPrimId.value =
    personasStore.activePrim?.id ?? personasStore.prims[0]?.id ?? null
  await loadOutfits().catch(() => {})
})
</script>
