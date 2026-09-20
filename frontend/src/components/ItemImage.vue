<template>
  <div
    class="overflow-hidden"
    :class="[
      containerClass,
      normalizeScale ? 'relative isolate' : 'flex items-center justify-center',
    ]"
    :style="backgroundStyle"
  >
    <div
      v-if="normalizeScale"
      class="absolute inset-0 overflow-hidden"
    >
      <img
        v-if="displaySrc"
        :key="imgRenderKey"
        :src="displaySrc"
        :alt="alt"
        :class="computedImgClass"
        :style="imgStyle"
        draggable="false"
        @load="onImageLoad"
      />
    </div>
    <img
      v-else-if="displaySrc"
      :key="imgRenderKey"
      :src="displaySrc"
      :alt="alt"
      :class="computedImgClass"
      draggable="false"
      @load="onImageLoad"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  itemImageContainClass,
  isPngLikeImageUrl,
  ITEM_IMAGE_SURFACE_BG,
  resolveStorageUrl,
} from '../api/media'
import { detectEdgeBackground, FALLBACK_BG } from '../utils/imageEdgeColor'
import { computeCoverNormalizeTransform } from '../utils/imageCoverNormalize'
import { getCleanedCutoutUrl } from '../utils/imageCutoutFringe'

const props = defineProps({
  src: {
    type: String,
    default: null,
  },
  alt: {
    type: String,
    default: '',
  },
  containerClass: {
    type: String,
    default: '',
  },
  imgClass: {
    type: String,
    default: 'max-h-full max-w-full',
  },
  fallbackBg: {
    type: String,
    default: FALLBACK_BG,
  },
  checkerboard: {
    type: Boolean,
    default: false,
  },
  normalizeScale: {
    type: Boolean,
    default: false,
  },
  normalizeFill: {
    type: Number,
    default: 0.66,
  },
  normalizeAlign: {
    type: String,
    default: 'bottom',
    validator: (v) => ['bottom', 'center'].includes(v),
  },
  /** When set, skips edge detection and uses this solid background. */
  fixedBackground: {
    type: String,
    default: null,
  },
  /** Clean white/studio fringe on existing PNG cutouts (catalog tiles). */
  cleanFringe: {
    type: Boolean,
    default: false,
  },
})

const resolvedSrc = computed(() => resolveStorageUrl(props.src) ?? props.src)
const displaySrc = ref(null)

const usesSurfaceBg = computed(
  () =>
    !props.fixedBackground &&
    (props.checkerboard || isPngLikeImageUrl(resolvedSrc.value))
)

const edgeColor = ref(
  props.fixedBackground ??
    (usesSurfaceBg.value ? ITEM_IMAGE_SURFACE_BG : props.fallbackBg)
)

const normalizeLayout = ref(null)

const imgRenderKey = computed(
  () =>
    `${displaySrc.value ?? resolvedSrc.value ?? ''}:${props.normalizeScale ? 'n' : 'o'}:${props.normalizeAlign}:${props.cleanFringe ? 'c' : 'r'}`
)

const backgroundStyle = computed(() => ({
  backgroundColor:
    props.fixedBackground ??
    (usesSurfaceBg.value ? ITEM_IMAGE_SURFACE_BG : edgeColor.value),
}))

const computedImgClass = computed(() => {
  if (props.normalizeScale) {
    return [
      props.imgClass,
      itemImageContainClass,
      'h-full w-full max-h-none max-w-none',
    ]
  }
  return [props.imgClass, itemImageContainClass]
})

const imgStyle = computed(() => {
  if (!props.normalizeScale || !normalizeLayout.value) return undefined
  return {
    transform: normalizeLayout.value.transform,
    transformOrigin: normalizeLayout.value.transformOrigin,
    willChange: 'transform',
  }
})

async function refreshDisplaySrc() {
  const src = resolvedSrc.value
  if (!src) {
    displaySrc.value = null
    return
  }

  if (!props.cleanFringe || !isPngLikeImageUrl(src)) {
    displaySrc.value = src
    return
  }

  try {
    displaySrc.value = await getCleanedCutoutUrl(src)
  } catch {
    displaySrc.value = src
  }
}

async function refreshBackground() {
  if (props.fixedBackground) {
    edgeColor.value = props.fixedBackground
    return
  }

  if (!resolvedSrc.value) {
    edgeColor.value = props.fallbackBg
    return
  }

  if (usesSurfaceBg.value) {
    edgeColor.value = ITEM_IMAGE_SURFACE_BG
    return
  }

  edgeColor.value = await detectEdgeBackground(resolvedSrc.value)
}

async function refreshNormalizeScale() {
  normalizeLayout.value = null
  const src = displaySrc.value ?? resolvedSrc.value
  if (!props.normalizeScale || !src) return

  try {
    normalizeLayout.value = await computeCoverNormalizeTransform(src, {
      fill: props.normalizeFill,
      align: props.normalizeAlign,
    })
  } catch {
    normalizeLayout.value = null
  }
}

defineExpose({
  getBaseline: () => normalizeLayout.value?.baseline ?? null,
})

async function onImageLoad() {
  await Promise.all([refreshBackground(), refreshNormalizeScale()])
}

watch(
  resolvedSrc,
  async () => {
    await refreshDisplaySrc()
    await onImageLoad()
  },
  { immediate: true }
)
watch(
  () => [props.normalizeScale, props.normalizeFill, props.normalizeAlign],
  () => {
    refreshNormalizeScale()
  }
)
watch(usesSurfaceBg, refreshBackground)
watch(
  () => props.fixedBackground,
  () => {
    refreshBackground()
  }
)
watch(
  () => props.cleanFringe,
  async () => {
    await refreshDisplaySrc()
    await refreshNormalizeScale()
  }
)
</script>
