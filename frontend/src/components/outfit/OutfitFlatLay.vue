<template>
  <div class="relative h-80 overflow-hidden bg-white px-3 py-3 sm:h-96 sm:px-4 sm:py-4">
    <div
      v-if="processing"
      class="absolute inset-x-0 top-2 z-10 flex justify-center"
    >
      <span class="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
        {{ t('style.cuttingItems') }}
      </span>
    </div>

    <div
      class="flex h-full min-h-0"
      :class="
        sideItems.length
          ? 'grid grid-cols-[1.3fr_0.7fr] gap-x-2 sm:gap-x-3'
          : ''
      "
    >
      <!-- Left: body hierarchy — scales to fit fixed height -->
      <div
        class="flex h-full min-h-0 flex-col justify-center gap-1"
        :class="sideItems.length ? '' : 'mx-auto w-full max-w-xs'"
      >
        <template v-if="mainItems.length">
          <button
            v-for="item in mainItems"
            :key="item.id"
            type="button"
            class="group relative flex min-h-0 w-full flex-1 items-center justify-center focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'max-h-full max-w-[92%] object-contain transition group-hover:scale-[1.02]',
                isCutout(item) ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)]' : 'opacity-60',
              ]"
              draggable="false"
            />
            <span v-else class="px-2 text-center text-xs text-gray-400">
              {{ item.name }}
            </span>
          </button>
        </template>
        <p
          v-else
          class="flex h-full items-center justify-center text-sm text-gray-400"
        >
          —
        </p>
      </div>

      <!-- Right: accents + feet -->
      <div
        v-if="sideItems.length"
        class="flex h-full min-h-0 flex-col items-center justify-between gap-1.5 py-0.5"
      >
        <div class="flex min-h-0 w-full flex-1 flex-col items-center justify-start gap-1">
          <button
            v-for="item in sideTopItems"
            :key="item.id"
            type="button"
            class="group flex min-h-0 w-[88%] max-w-36 flex-1 items-center justify-center focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'max-h-full max-w-full object-contain transition group-hover:scale-[1.03]',
                isCutout(item) ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)]' : 'opacity-60',
              ]"
              draggable="false"
            />
          </button>
        </div>
        <div class="flex min-h-0 w-full flex-[1.1] flex-col items-center justify-end gap-1">
          <button
            v-for="item in sideFootItems"
            :key="item.id"
            type="button"
            class="group flex min-h-0 w-[90%] max-w-40 flex-1 items-center justify-center focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'max-h-full max-w-full object-contain transition group-hover:scale-[1.03]',
                isCutout(item) ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)]' : 'opacity-60',
              ]"
              draggable="false"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { resolveStorageUrl } from '../../api/media'
import { useI18n } from '../../composables/useI18n'
import {
  resolveItemBodyZone,
  resolveItemWearLayer,
  splitOutfitItemsForFlatLay,
} from '../../constants/itemBodyPlacement'
import {
  getOutfitItemCutout,
  itemPersistedCutoutUrl,
  peekOutfitItemCutout,
} from '../../utils/outfitItemCutoutCache'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select-item'])

const { t } = useI18n()
const router = useRouter()

const cutouts = reactive({})
const processing = ref(false)
let runId = 0

const split = computed(() => splitOutfitItemsForFlatLay(props.items))
const mainItems = computed(() => split.value.mains)
const sideItems = computed(() => split.value.side)

const sideTopItems = computed(() =>
  sideItems.value.filter((i) => resolveItemBodyZone(i) !== 'feet'),
)
const sideFootItems = computed(() =>
  sideItems.value.filter((i) => resolveItemBodyZone(i) === 'feet'),
)

function originalThumb(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

function thumb(item) {
  const id = String(item.id)
  return cutouts[id] ?? peekOutfitItemCutout(item) ?? originalThumb(item)
}

function isCutout(item) {
  return Boolean(cutouts[String(item.id)] || peekOutfitItemCutout(item))
}

function itemTitle(item) {
  const zone = resolveItemBodyZone(item)
  const layer = resolveItemWearLayer(item)
  const bits = [item.name]
  if (zone) bits.push(t(`item.bodyZones.${zone}`))
  if (layer) bits.push(t(`item.wearLayers.${layer}`))
  return bits.join(' · ')
}

function openItem(item) {
  if (!item?.id) return
  const groupId = item.category_id != null ? String(item.category_id) : null
  const collectionName =
    item.collection_group?.name ??
    item.collectionGroup?.name ??
    'collection'

  const resolved = router.resolve({
    name: 'item-overview',
    params: {
      name: String(collectionName),
      item_name: String(item.id),
    },
    query: groupId ? { groupId } : {},
  })

  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

async function processItems(items) {
  const current = ++runId
  const list = items ?? []
  if (!list.length) {
    processing.value = false
    return
  }

  processing.value = true
  try {
    for (const item of list) {
      if (current !== runId) return
      const peeked = peekOutfitItemCutout(item)
      if (peeked) {
        cutouts[String(item.id)] = peeked
        continue
      }
      try {
        const entry = await getOutfitItemCutout(item)
        if (current !== runId) return
        cutouts[String(item.id)] = entry.previewUrl
      } catch {
        // keep original
      }
    }
  } finally {
    if (current === runId) processing.value = false
  }
}

watch(
  () =>
    (props.items ?? [])
      .map(
        (i) =>
          `${i.id}:${itemPersistedCutoutUrl(i) ?? ''}:${i.image_url ?? i.images?.[0]?.url ?? ''}:${i.body_zone ?? ''}:${i.wear_layer ?? ''}`,
      )
      .join('|'),
  () => {
    processItems(props.items)
  },
  { immediate: true },
)
</script>
