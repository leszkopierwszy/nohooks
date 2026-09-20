<template>
  <div class="space-y-4">
    <div
      v-if="showCategoryFilters && fashionCats.length"
      class="flex flex-wrap gap-2"
    >
      <button
        v-for="cat in fashionCats"
        :key="cat.id"
        type="button"
        class="rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition"
        :class="
          isCategorySelected(cat.id)
            ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
            : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
        "
        @click="toggleCategory(cat.id)"
      >
        {{ cat.name }}
        <span class="ml-1 text-gray-400">({{ categoryItemCount(cat.id) }})</span>
      </button>
    </div>

    <div
      v-if="visibleItems.length"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      :class="compact ? 'lg:grid-cols-4' : 'lg:grid-cols-5'"
    >
      <button
        v-for="item in visibleItems"
        :key="item.id"
        type="button"
        class="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        :class="
          isSelected(item.id)
            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
            : 'border-gray-200 hover:border-gray-300'
        "
        @click="toggle(item.id)"
      >
        <div class="relative aspect-square w-full shrink-0 overflow-hidden bg-white">
          <img
            v-if="itemThumb(item)"
            :src="itemThumb(item)"
            :alt="item.name"
            class="absolute inset-0 size-full object-contain p-2.5"
            :class="isCutoutThumb(item) ? '' : 'opacity-55'"
            draggable="false"
          />
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-gray-400"
          >
            {{ item.name }}
          </div>
          <span
            class="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full text-xs font-bold"
            :class="
              isSelected(item.id)
                ? 'bg-indigo-600 text-white'
                : 'bg-white/95 text-gray-400 ring-1 ring-gray-200'
            "
            aria-hidden="true"
          >
            {{ isSelected(item.id) ? '✓' : '' }}
          </span>
        </div>
        <div class="flex min-h-12 flex-1 flex-col justify-center border-t border-gray-100 px-2.5 py-2">
          <p class="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
            {{ item.name }}
          </p>
        </div>
      </button>
    </div>
    <p
      v-else
      class="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500"
    >
      {{ t('outfit.itemsEmptyFiltered') }}
    </p>

    <div
      v-if="showSelectedStrip && selectedItems.length"
      class="rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm"
    >
      <p class="text-sm font-semibold text-gray-900">
        {{ t('outfit.selectedStrip', { count: selectedItems.length }) }}
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="item in selectedItems"
          :key="item.id"
          type="button"
          class="inline-flex max-w-40 items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2.5 text-xs font-medium text-gray-800 hover:bg-gray-200"
          @click="toggle(item.id)"
        >
          <span class="size-6 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
            <img
              v-if="itemThumb(item)"
              :src="itemThumb(item)"
              alt=""
              class="size-full object-contain p-0.5"
            />
          </span>
          <span class="truncate">{{ item.name }}</span>
          <span class="text-gray-400">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { resolveStorageUrl } from '../../api/media'
import { useI18n } from '../../composables/useI18n'
import { itemFitsPersona } from '../../constants/itemPersonaFit'
import {
  fashionCollections,
  itemBelongsToFashion,
} from '../../constants/outfitCollections'
import { useCollectionStore } from '../../stores/collection'
import {
  getOutfitItemPlainCutout,
  peekOutfitItemPlainCutout,
} from '../../utils/outfitItemCutoutCache'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  entityId: { type: [String, Number], default: '' },
  singleSelect: { type: Boolean, default: false },
  showCategoryFilters: { type: Boolean, default: true },
  showSelectedStrip: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const collectionStore = useCollectionStore()
const selectedCategoryIds = ref([])
const cutouts = reactive({})
let cutoutRunId = 0

const fashionCats = computed(() => fashionCollections(collectionStore.collections))

const fashionItems = computed(() => {
  const entityId = props.entityId
  return (collectionStore.allItemsList ?? [])
    .filter((item) => itemBelongsToFashion(item))
    .filter((item) => (entityId ? itemFitsPersona(item, entityId) : true))
})

const visibleItems = computed(() => {
  const ids = selectedCategoryIds.value.map(String)
  if (!ids.length) return fashionItems.value
  return fashionItems.value.filter((item) => ids.includes(String(item.category_id)))
})

const selectedItems = computed(() => {
  const set = new Set((props.modelValue ?? []).map(Number))
  return fashionItems.value.filter((item) => set.has(Number(item.id)))
})

function categoryItemCount(categoryId) {
  const id = String(categoryId)
  return fashionItems.value.filter((item) => String(item.category_id) === id).length
}

function isCategorySelected(id) {
  return selectedCategoryIds.value.some((x) => String(x) === String(id))
}

function toggleCategory(id) {
  const key = String(id)
  if (isCategorySelected(key)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter((x) => String(x) !== key)
  } else {
    selectedCategoryIds.value = [...selectedCategoryIds.value, key]
  }
}

function isSelected(id) {
  return (props.modelValue ?? []).some((x) => Number(x) === Number(id))
}

function toggle(id) {
  const n = Number(id)
  if (props.singleSelect) {
    emit('update:modelValue', isSelected(n) ? [] : [n])
    return
  }
  if (isSelected(n)) {
    emit(
      'update:modelValue',
      (props.modelValue ?? []).filter((x) => Number(x) !== n)
    )
  } else {
    emit('update:modelValue', [...(props.modelValue ?? []), n])
  }
}

function originalThumb(item) {
  const raw = item?.cover ?? item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

function itemThumb(item) {
  const id = String(item.id)
  return cutouts[id] ?? peekOutfitItemPlainCutout(item) ?? originalThumb(item)
}

function isCutoutThumb(item) {
  return Boolean(cutouts[String(item.id)] || peekOutfitItemPlainCutout(item))
}

async function processItemCutouts(items) {
  const current = ++cutoutRunId
  for (const item of items ?? []) {
    if (current !== cutoutRunId) return
    const id = String(item.id)
    const peeked = peekOutfitItemPlainCutout(item)
    if (peeked) {
      cutouts[id] = peeked
      continue
    }
    try {
      const entry = await getOutfitItemPlainCutout(item)
      if (current !== cutoutRunId) return
      cutouts[id] = entry.previewUrl
    } catch {
      /* keep original */
    }
  }
}

watch(
  visibleItems,
  (items) => {
    processItemCutouts(items.slice(0, 40))
  },
  { immediate: true }
)

onMounted(() => {
  if (!collectionStore.allItemsList?.length) {
    collectionStore.fetchAllItems().catch(() => {})
  }
  if (!collectionStore.collections?.length) {
    collectionStore.fetchCollections().catch(() => {})
  }
})
</script>
