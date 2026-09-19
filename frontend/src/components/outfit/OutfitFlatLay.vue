<template>
  <div class="relative h-80 overflow-hidden bg-white px-3 py-3 sm:h-96 sm:px-4 sm:py-4">
    <div
      v-if="processing"
      class="absolute inset-x-0 top-2 z-10 flex justify-center"
    >
      <span
        class="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200"
      >
        {{ t('style.cuttingItems') }}
      </span>
    </div>

    <div
      class="flex h-full min-h-0"
      :class="
        sideItems.length
          ? 'grid grid-cols-[1.35fr_0.65fr] gap-x-3 sm:gap-x-4'
          : ''
      "
    >
      <!-- Left: shared width band so tee / skirt / dress read at similar scale -->
      <div
        class="flex h-full min-h-0 w-full flex-col justify-center gap-2"
        :class="sideItems.length ? '' : 'mx-auto max-w-sm'"
      >
        <template v-if="mainItems.length">
          <button
            v-for="item in mainItems"
            :key="item.id"
            type="button"
            class="group relative flex w-full min-h-0 flex-1 items-center justify-center focus:outline-none"
            :style="mainSlotStyle(item)"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'block w-full max-h-full object-contain object-center transition group-hover:scale-[1.02]',
                isCutout(item)
                  ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                  : 'opacity-60',
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

      <!-- Right: hosiery + shoes — capped width, still readable -->
      <div
        v-if="sideItems.length"
        class="flex h-full min-h-0 flex-col items-stretch justify-between gap-2 py-0.5"
      >
        <div
          class="flex min-h-0 w-full flex-1 flex-col items-center justify-start gap-2"
        >
          <button
            v-for="item in sideTopItems"
            :key="item.id"
            type="button"
            class="group flex min-h-[4.5rem] w-full max-w-[9.5rem] flex-1 items-center justify-center focus:outline-none sm:min-h-[5.5rem]"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'block h-auto max-h-full w-[92%] object-contain transition group-hover:scale-[1.03]',
                isCutout(item)
                  ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                  : 'opacity-60',
              ]"
              draggable="false"
            />
          </button>
        </div>
        <div
          class="flex min-h-0 w-full flex-[1.05] flex-col items-center justify-end gap-2"
        >
          <button
            v-for="item in sideFootItems"
            :key="item.id"
            type="button"
            class="group flex min-h-[5rem] w-full max-w-[10.5rem] flex-1 items-center justify-center focus:outline-none sm:min-h-[6rem]"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'block h-auto max-h-full w-full object-contain transition group-hover:scale-[1.03]',
                isCutout(item)
                  ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                  : 'opacity-60',
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
  isLegsBaseLayer,
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
  sideItems.value.filter(
    (i) => resolveItemBodyZone(i) !== 'feet' || isLegsBaseLayer(i),
  ),
)
const sideFootItems = computed(() =>
  sideItems.value.filter(
    (i) => resolveItemBodyZone(i) === 'feet' && !isLegsBaseLayer(i),
  ),
)

/**
 * Keep main-column pieces at a readable shared width.
 * Full-body / dresses can take a bit more vertical flex; skirts share width with tops.
 */
function mainSlotStyle(item) {
  const zone = resolveItemBodyZone(item)
  const count = Math.max(1, mainItems.value.length)
  const base = 1
  let grow = base
  if (zone === 'full') grow = 1.35
  else if (zone === 'legs') grow = 1.15
  else if (zone === 'torso' || zone === 'head') grow = 1.1
  // Soft floor so 2–3 items never collapse into a tiny strip
  const minPct = count <= 2 ? 38 : count === 3 ? 28 : 22
  return {
    flexGrow: grow,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: `${minPct}%`,
  }
}

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
