<template>
  <div class="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'Style' }"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← {{ t('style.nav.outfits') }}
        </RouterLink>
        <h1 class="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          {{ isEditing ? t('outfit.formEdit') : t('outfit.formCreate') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('outfit.editorSubtitle') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          @click="goBack"
        >
          {{ t('outfit.cancel') }}
        </button>
        <button
          type="button"
          :disabled="saving || !canSave"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit"
        >
          {{ saving ? t('outfit.saving') : t('outfit.save') }}
        </button>
      </div>
    </div>

    <p
      v-if="pageError"
      class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {{ pageError }}
    </p>

    <div
      v-if="loading"
      class="mt-10 text-sm text-gray-500"
    >
      {{ t('common.loading') }}
    </div>

    <form
      v-else
      class="mt-8 space-y-8"
      @submit.prevent="submit"
    >
      <!-- Name + meta -->
      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="sm:col-span-2 lg:col-span-2">
            <label
              for="outfit-name"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t('outfit.name') }}
            </label>
            <input
              id="outfit-name"
              v-model="form.label"
              type="text"
              maxlength="255"
              :placeholder="t('outfit.namePlaceholder')"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div>
            <label
              for="outfit-prim"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t('outfit.prim') }}
            </label>
            <select
              id="outfit-prim"
              v-model="form.entity_id"
              required
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option value="" disabled>{{ t('outfit.primPlaceholder') }}</option>
              <option
                v-for="prim in prims"
                :key="prim.id"
                :value="String(prim.id)"
              >
                {{ prim.name }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="outfit-date"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t('outfit.wearDate') }}
            </label>
            <input
              id="outfit-date"
              v-model="form.wear_date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div class="sm:col-span-2 lg:col-span-2">
            <label
              for="outfit-occasion"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t('outfit.occasion') }}
            </label>
            <select
              id="outfit-occasion"
              v-model="form.occasion"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option value="">{{ t('outfit.occasionNone') }}</option>
              <option
                v-for="occ in OUTFIT_OCCASIONS"
                :key="occ.value"
                :value="occ.value"
              >
                {{ t(occ.labelKey) }}
              </option>
            </select>
          </div>
          <div class="sm:col-span-2 lg:col-span-2">
            <label
              for="outfit-notes"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t('outfit.notes') }}
            </label>
            <input
              id="outfit-notes"
              v-model="form.notes"
              type="text"
              maxlength="5000"
              :placeholder="t('outfit.notesPlaceholder')"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
        </div>
      </section>

      <!-- Fashion categories -->
      <section>
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">
              {{ t('outfit.categoriesTitle') }}
            </h2>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ t('outfit.categoriesHint') }}
            </p>
          </div>
          <button
            v-if="selectedCategoryIds.length"
            type="button"
            class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            @click="selectedCategoryIds = []"
          >
            {{ t('outfit.clearCategories') }}
          </button>
        </div>

        <div
          v-if="fashionCats.length"
          class="mt-3 flex flex-wrap gap-2"
        >
          <button
            v-for="cat in fashionCats"
            :key="cat.id"
            type="button"
            class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
            :class="
              isCategorySelected(cat.id)
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            "
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
            <span class="ml-1 tabular-nums opacity-70">
              {{ categoryItemCount(cat.id) }}
            </span>
          </button>
        </div>
        <p
          v-else
          class="mt-3 text-sm text-gray-500"
        >
          {{ t('outfit.categoriesEmpty') }}
        </p>
      </section>

      <!-- Item grid -->
      <section>
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-sm font-semibold text-gray-900">
            {{ t('outfit.items') }}
          </h2>
          <p class="text-xs text-gray-500">
            {{ t('outfit.itemsSelected', { count: form.item_ids.length }) }}
          </p>
        </div>

        <div
          v-if="visibleItems.length"
          class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <button
            v-for="item in visibleItems"
            :key="item.id"
            type="button"
            class="group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            :class="
              isItemSelected(item.id)
                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                : 'border-gray-200 hover:border-gray-300'
            "
            @click="toggleItem(item.id)"
          >
            <div class="relative aspect-square bg-neutral-50">
              <img
                v-if="itemThumb(item)"
                :src="itemThumb(item)"
                :alt="item.name"
                class="size-full object-contain p-2"
                draggable="false"
              />
              <div
                v-else
                class="flex size-full items-center justify-center px-2 text-center text-xs text-gray-400"
              >
                {{ item.name }}
              </div>
              <span
                class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-xs font-bold"
                :class="
                  isItemSelected(item.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/90 text-gray-400 ring-1 ring-gray-200'
                "
                aria-hidden="true"
              >
                {{ isItemSelected(item.id) ? '✓' : '' }}
              </span>
            </div>
            <div class="border-t border-gray-100 px-2.5 py-2">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ item.name }}
              </p>
              <p class="mt-0.5 truncate text-[11px] text-gray-500">
                {{ itemCollectionLabel(item) }}
              </p>
            </div>
          </button>
        </div>
        <p
          v-else
          class="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500"
        >
          {{ t('outfit.itemsEmptyFiltered') }}
        </p>
      </section>

      <!-- Selected strip -->
      <section
        v-if="selectedItems.length"
        class="sticky bottom-4 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ t('outfit.selectedStrip', { count: selectedItems.length }) }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="item in selectedItems"
                :key="item.id"
                type="button"
                class="inline-flex max-w-40 items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2.5 text-xs font-medium text-gray-800 hover:bg-gray-200"
                :title="t('outfit.removeItem')"
                @click="toggleItem(item.id)"
              >
                <span
                  class="size-6 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200"
                >
                  <img
                    v-if="itemThumb(item)"
                    :src="itemThumb(item)"
                    alt=""
                    class="size-full object-cover"
                  />
                </span>
                <span class="truncate">{{ item.name }}</span>
                <span class="text-gray-400">×</span>
              </button>
            </div>
          </div>
          <button
            type="submit"
            :disabled="saving || !canSave"
            class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ saving ? t('outfit.saving') : t('outfit.save') }}
          </button>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import { itemFitsPersona } from '../constants/itemPersonaFit'
import { OUTFIT_OCCASIONS } from '../constants/outfitOccasions'
import {
  fashionCollections,
  itemBelongsToFashion,
  itemCollectionName,
} from '../constants/outfitCollections'
import { useCollectionStore } from '../stores/collection'
import { useOutfitsStore, wearDateKey } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'
import { toDateKey } from '../utils/calendarGrid'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()
const collectionStore = useCollectionStore()

const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const selectedCategoryIds = ref([])

const form = reactive({
  entity_id: '',
  wear_date: toDateKey(new Date()),
  label: '',
  occasion: '',
  notes: '',
  item_ids: [],
})

const isEditing = computed(() => Boolean(route.params.id))
const editingId = computed(() =>
  route.params.id ? Number(route.params.id) : null,
)

const prims = computed(() => personasStore.prims)

const fashionCats = computed(() =>
  fashionCollections(collectionStore.collections),
)

const fashionItems = computed(() => {
  const entityId = form.entity_id
  return (collectionStore.allItemsList ?? [])
    .filter((item) => itemBelongsToFashion(item))
    .filter((item) => (entityId ? itemFitsPersona(item, entityId) : true))
})

const visibleItems = computed(() => {
  const ids = selectedCategoryIds.value.map(String)
  if (!ids.length) return fashionItems.value
  return fashionItems.value.filter((item) =>
    ids.includes(String(item.category_id)),
  )
})

const selectedItems = computed(() => {
  const set = new Set(form.item_ids.map(Number))
  return fashionItems.value.filter((item) => set.has(Number(item.id)))
})

const canSave = computed(
  () => Boolean(form.entity_id && form.wear_date),
)

function categoryItemCount(categoryId) {
  const id = String(categoryId)
  return fashionItems.value.filter((item) => String(item.category_id) === id)
    .length
}

function isCategorySelected(id) {
  return selectedCategoryIds.value.some((x) => String(x) === String(id))
}

function toggleCategory(id) {
  const key = String(id)
  if (isCategorySelected(key)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter(
      (x) => String(x) !== key,
    )
  } else {
    selectedCategoryIds.value = [...selectedCategoryIds.value, key]
  }
}

function isItemSelected(id) {
  return form.item_ids.some((x) => Number(x) === Number(id))
}

function toggleItem(id) {
  const n = Number(id)
  if (isItemSelected(n)) {
    form.item_ids = form.item_ids.filter((x) => Number(x) !== n)
  } else {
    form.item_ids = [...form.item_ids, n]
  }
}

function itemThumb(item) {
  const raw =
    item?.cover ??
    item?.image_url ??
    item?.cutout_image_url ??
    item?.images?.[0]?.url ??
    null
  return resolveStorageUrl(raw) ?? raw
}

function itemCollectionLabel(item) {
  return itemCollectionName(item) || '—'
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'Style' })
}

function applyOutfit(outfit) {
  form.entity_id = String(outfit.entity_id ?? outfit.entity?.id ?? '')
  form.wear_date = wearDateKey(outfit) || toDateKey(new Date())
  form.label = outfit.label ?? ''
  form.occasion = outfit.occasion ?? ''
  form.notes = outfit.notes ?? ''
  form.item_ids = (outfit.items ?? []).map((item) => Number(item.id))
}

function resetCreateDefaults() {
  form.entity_id = ''
  form.wear_date =
    typeof route.query.date === 'string' && route.query.date
      ? route.query.date
      : toDateKey(new Date())
  form.label = ''
  form.occasion =
    typeof route.query.occasion === 'string' ? route.query.occasion : ''
  form.notes = ''
  form.item_ids = []
  selectedCategoryIds.value = []

  const primFromQuery =
    typeof route.query.entity_id === 'string' ? route.query.entity_id : ''
  if (primFromQuery) {
    form.entity_id = primFromQuery
  } else if (personasStore.activePersonaId) {
    form.entity_id = String(personasStore.activePersonaId)
  } else if (prims.value[0]) {
    form.entity_id = String(prims.value[0].id)
  }
}

async function loadPage() {
  loading.value = true
  pageError.value = ''
  try {
    await Promise.all([
      personasStore.personas.length
        ? Promise.resolve()
        : personasStore.fetchPersonas(),
      collectionStore.collections.length
        ? Promise.resolve()
        : collectionStore.fetchCollections(),
      collectionStore.allItemsList.length
        ? Promise.resolve()
        : collectionStore.fetchAllItems(),
    ])

    if (isEditing.value) {
      let outfit =
        outfitsStore.outfits.find(
          (o) => Number(o.id) === Number(editingId.value),
        ) ?? null
      if (!outfit) {
        outfit = await outfitsStore.fetchOutfit(editingId.value)
      }
      applyOutfit(outfit)
    } else {
      resetCreateDefaults()
    }
  } catch (err) {
    pageError.value = err.message ?? String(err)
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSave.value) {
    pageError.value = t('outfit.primPlaceholder')
    return
  }
  saving.value = true
  pageError.value = ''
  const payload = {
    entity_id: Number(form.entity_id),
    wear_date: form.wear_date,
    label: form.label?.trim() || null,
    occasion: form.occasion || null,
    notes: form.notes?.trim() || null,
    item_ids: form.item_ids.map((id) => Number(id)),
    source: 'manual',
  }
  try {
    if (isEditing.value) {
      await outfitsStore.updateOutfit(editingId.value, payload)
    } else {
      await outfitsStore.createOutfit(payload)
    }
    goBack()
  } catch (err) {
    pageError.value = err.message ?? String(err)
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.params.id, route.query.date, route.query.occasion, route.query.entity_id],
  () => {
    loadPage()
  },
)

onMounted(loadPage)
</script>
