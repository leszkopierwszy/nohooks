<template>
  <div class="relative bg-neutral-100 px-3 py-4 sm:px-4 sm:py-5">
    <div
      v-if="processing"
      class="absolute inset-x-0 top-2 z-10 flex justify-center"
    >
      <span class="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm">
        {{ t('style.cuttingItems') }}
      </span>
    </div>

    <div
      :class="
        accessories.length
          ? 'grid min-h-72 grid-cols-[1.25fr_0.75fr] items-stretch gap-x-2 sm:min-h-80 sm:gap-x-3'
          : 'flex min-h-72 flex-col sm:min-h-80'
      "
    >
      <!-- Left: main garments — tight stack -->
      <div
        class="flex min-h-0 flex-col justify-center gap-1.5 sm:gap-2"
        :class="accessories.length ? '' : 'mx-auto w-full max-w-xs'"
      >
        <template v-if="mains.length">
          <button
            v-for="(item, index) in mains"
            :key="item.id"
            type="button"
            class="group relative flex w-full items-center justify-center focus:outline-none"
            :class="mainItemClass(index)"
            :title="item.name"
            @click="$emit('select-item', item)"
          >
            <img
              v-if="thumb(item)"
              :src="thumb(item)"
              :alt="item.name"
              :class="[
                'max-h-full max-w-[92%] object-contain transition group-hover:scale-[1.02]',
                isCutout(item) ? 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]' : 'opacity-50',
              ]"
              draggable="false"
            />
            <span
              v-else
              class="px-2 text-center text-xs text-gray-400"
            >
              {{ item.name }}
            </span>
          </button>
        </template>
        <p
          v-else
          class="flex flex-1 items-center justify-center text-sm text-gray-400"
        >
          —
        </p>
      </div>

      <!-- Right: accessories — closer, larger -->
      <div
        v-if="accessories.length"
        class="flex min-h-0 flex-col items-center justify-center gap-2 py-0.5 sm:gap-2.5"
      >
        <button
          v-for="item in accessories"
          :key="item.id"
          type="button"
          class="group flex w-[88%] max-w-36 items-center justify-center focus:outline-none sm:w-[85%]"
          :title="item.name"
          @click="$emit('select-item', item)"
        >
          <img
            v-if="thumb(item)"
            :src="thumb(item)"
            :alt="item.name"
            :class="[
              'max-h-24 w-full object-contain transition group-hover:scale-[1.03] sm:max-h-28',
              isCutout(item) ? 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]' : 'opacity-50',
            ]"
            draggable="false"
          />
          <span
            v-else
            class="px-1 text-center text-[11px] text-gray-400"
          >
            {{ item.name }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { resolveStorageUrl } from '../../api/media'
import { useI18n } from '../../composables/useI18n'
import { splitOutfitItemsForFlatLay } from '../../utils/outfitFlatLay'
import {
  getOutfitItemCutout,
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

/** itemId → cutout preview URL */
const cutouts = reactive({})
const processing = ref(false)
let runId = 0

const split = computed(() => splitOutfitItemsForFlatLay(props.items))

const mains = computed(() => {
  const base = [
    ...split.value.tops,
    ...split.value.onePieces,
    ...split.value.bottoms,
  ]
  if (base.length) return base
  const extras = split.value.accessories
  if (extras.length <= 1) return extras
  return extras.slice(0, Math.min(2, extras.length))
})

const accessories = computed(() => {
  const base = split.value.accessories
  const hasClassifiedMains =
    split.value.tops.length +
      split.value.onePieces.length +
      split.value.bottoms.length >
    0
  if (hasClassifiedMains) return base
  if (base.length <= 1) return []
  return base.slice(Math.min(2, base.length))
})

function originalThumb(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

function thumb(item) {
  const id = String(item.id)
  return cutouts[id] ?? peekOutfitItemCutout(item) ?? originalThumb(item)
}

function isCutout(item) {
  const id = String(item.id)
  return Boolean(cutouts[id] || peekOutfitItemCutout(item))
}

function mainItemClass(index) {
  const total = mains.value.length
  const isLast = index === total - 1
  if (total === 1) return 'min-h-52 flex-1 sm:min-h-64'
  if (total >= 2 && isLast) return 'min-h-36 flex-[1.15] sm:min-h-44'
  return 'min-h-28 flex-1 sm:min-h-32'
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
        // keep original thumb
      }
    }
  } finally {
    if (current === runId) processing.value = false
  }
}

watch(
  () =>
    (props.items ?? [])
      .map((i) => `${i.id}:${i.image_url ?? i.images?.[0]?.url ?? ''}`)
      .join('|'),
  () => {
    processItems(props.items)
  },
  { immediate: true },
)
</script>
