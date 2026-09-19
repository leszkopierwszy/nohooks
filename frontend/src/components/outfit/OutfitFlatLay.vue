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
      class="grid h-full min-h-0 gap-x-3 sm:gap-x-4"
      :class="sideItems.length ? 'grid-cols-[1.4fr_0.6fr]' : 'grid-cols-1'"
    >
      <!--
        Equal-height rows + full-cell image boxes so every main piece
        (tee, skirt, dress) shares the same width band — object-fit only
        scales the bitmap inside the box, it must not shrink the box.
      -->
      <div
        class="grid h-full min-h-0 w-full gap-y-2"
        :class="sideItems.length ? '' : 'mx-auto max-w-sm'"
        :style="mainGridStyle"
      >
        <template v-if="mainItems.length">
          <button
            v-for="item in mainItems"
            :key="item.id"
            type="button"
            class="group relative min-h-0 w-full overflow-hidden focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <span
              class="absolute inset-0 flex items-center justify-center px-[4%]"
            >
              <img
                v-if="thumb(item)"
                :src="thumb(item)"
                :alt="item.name"
                :style="mainImageStyle(item)"
                :class="[
                  'h-full w-full object-contain object-center transition group-hover:brightness-[1.02]',
                  isCutout(item)
                    ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                    : 'opacity-60',
                ]"
                draggable="false"
              />
              <span
                v-else
                class="px-2 text-center text-xs text-gray-400"
              >
                {{ item.name }}
              </span>
            </span>
          </button>
        </template>
        <p
          v-else
          class="flex items-center justify-center text-sm text-gray-400"
        >
          —
        </p>
      </div>

      <div
        v-if="sideItems.length"
        class="grid h-full min-h-0 grid-rows-[1fr_1.05fr] gap-y-2"
      >
        <div
          class="grid min-h-0 gap-y-2"
          :style="sideTopGridStyle"
        >
          <button
            v-for="item in sideTopItems"
            :key="item.id"
            type="button"
            class="group relative min-h-0 w-full overflow-hidden focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <span
              class="absolute inset-0 flex items-center justify-center px-[6%]"
            >
              <img
                v-if="thumb(item)"
                :src="thumb(item)"
                :alt="item.name"
                :class="[
                  'h-full w-full object-contain object-center transition group-hover:scale-[1.03]',
                  isCutout(item)
                    ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                    : 'opacity-60',
                ]"
                draggable="false"
              />
            </span>
          </button>
        </div>
        <div
          class="grid min-h-0 gap-y-2"
          :style="sideFootGridStyle"
        >
          <button
            v-for="item in sideFootItems"
            :key="item.id"
            type="button"
            class="group relative min-h-0 w-full overflow-hidden focus:outline-none"
            :title="itemTitle(item)"
            @click="openItem(item)"
          >
            <span
              class="absolute inset-0 flex items-center justify-center px-[4%]"
            >
              <img
                v-if="thumb(item)"
                :src="thumb(item)"
                :alt="item.name"
                :class="[
                  'h-full w-full object-contain object-center transition group-hover:scale-[1.03]',
                  isCutout(item)
                    ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]'
                    : 'opacity-60',
                ]"
                draggable="false"
              />
            </span>
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

/** Equal 1fr rows — optional extra weight for full-body pieces. */
const mainGridStyle = computed(() => {
  const rows = mainItems.value.map((item) => {
    const zone = resolveItemBodyZone(item)
    if (zone === 'full') return '1.25fr'
    if (zone === 'legs') return '1.1fr'
    return '1fr'
  })
  if (!rows.length) return { gridTemplateRows: '1fr' }
  return { gridTemplateRows: rows.join(' ') }
})

const sideTopGridStyle = computed(() => {
  const n = Math.max(1, sideTopItems.value.length)
  return { gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }
})

const sideFootGridStyle = computed(() => {
  const n = Math.max(1, sideFootItems.value.length)
  return { gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }
})

/**
 * Short garments (skirt / shorts) often look tiny next to a tee after cutout.
 * Keep the layout box identical, then boost scale so width reads like the top.
 */
function mainImageStyle(item) {
  const zone = resolveItemBodyZone(item)
  const layer = resolveItemWearLayer(item)
  let scale = 1
  if (zone === 'legs' && layer === 'mid') scale = 1.45
  else if (zone === 'legs') scale = 1.2
  else if (zone === 'torso') scale = 1.05
  else if (zone === 'full') scale = 1.08
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
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
