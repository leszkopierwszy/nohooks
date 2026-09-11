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
        v-if="resolvedSrc"
        :key="imgRenderKey"
        :src="resolvedSrc"
        :alt="alt"
        :class="computedImgClass"
        :style="imgStyle"
        draggable="false"
        @load="onImageLoad"
      />
    </div>
    <img
      v-else-if="resolvedSrc"
      :key="imgRenderKey"
      :src="resolvedSrc"
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
})

const resolvedSrc = computed(() => resolveStorageUrl(props.src) ?? props.src)

const usesSurfaceBg = computed(
  () => props.checkerboard || isPngLikeImageUrl(resolvedSrc.value)
)

const edgeColor = ref(
  usesSurfaceBg.value ? ITEM_IMAGE_SURFACE_BG : props.fallbackBg
)

const normalizeLayout = ref(null)

const imgRenderKey = computed(
  () =>
    `${resolvedSrc.value ?? ''}:${props.normalizeScale ? 'n' : 'o'}:${props.normalizeAlign}`
)

const backgroundStyle = computed(() => ({
  backgroundColor: usesSurfaceBg.value ? ITEM_IMAGE_SURFACE_BG : edgeColor.value,
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

async function refreshBackground() {
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
  if (!props.normalizeScale || !resolvedSrc.value) return

  try {
    normalizeLayout.value = await computeCoverNormalizeTransform(resolvedSrc.value, {
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

watch(resolvedSrc, onImageLoad, { immediate: true })
watch(
  () => [props.normalizeScale, props.normalizeFill, props.normalizeAlign],
  () => {
    refreshNormalizeScale()
  }
)
watch(usesSurfaceBg, refreshBackground)
</script>
