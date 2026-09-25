<template>
  <Dialog class="relative z-50" :open="open" @close="onCancel">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-zinc-50">
          {{ t('account.avatar.cropTitle') }}
        </DialogTitle>
        <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          {{ t('account.avatar.cropHint') }}
        </p>

        <div
          ref="stageRef"
          class="relative mt-5 mx-auto aspect-square w-full max-w-[20rem] touch-none overflow-hidden rounded-lg bg-gray-900 select-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
        >
          <img
            v-if="imageUrl"
            ref="imgRef"
            :src="imageUrl"
            alt=""
            class="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
            :style="imageStyle"
            draggable="false"
            @load="onImageLoad"
          />
          <div
            class="pointer-events-none absolute inset-0"
            :style="{
              background:
                'radial-gradient(circle closest-side, transparent 99.5%, rgba(0,0,0,0.55) 100%)',
            }"
          />
          <div
            class="pointer-events-none absolute left-1/2 top-1/2 size-[min(78%,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/90"
          />
        </div>

        <div class="mt-4">
          <label for="avatar-zoom" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            {{ t('account.avatar.zoom') }}
          </label>
          <input
            id="avatar-zoom"
            v-model.number="zoom"
            type="range"
            :min="minZoom"
            :max="maxZoom"
            :step="0.01"
            class="mt-2 w-full accent-indigo-600"
          />
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            :disabled="saving"
            @click="onCancel"
          >
            {{ t('account.avatar.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            :disabled="!ready || saving"
            @click="onConfirm"
          >
            {{ saving ? t('account.avatar.saving') : t('account.avatar.save') }}
          </button>
        </div>
        <p v-if="error" class="mt-3 text-sm text-rose-600">{{ error }}</p>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useI18n } from '../../composables/useI18n'
import { normalizeUploadImageFile } from '../../utils/normalizeUploadImage'

const OUTPUT_SIZE = 512
const CIRCLE_RATIO = 0.78

const props = defineProps({
  open: { type: Boolean, default: false },
  file: { type: File, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useI18n()

const stageRef = ref(null)
const imgRef = ref(null)
const imageUrl = ref('')
const naturalW = ref(0)
const naturalH = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const zoom = ref(1)
const minZoom = ref(1)
const maxZoom = 4
const ready = ref(false)
const error = ref('')

const dragging = ref(false)
const dragStart = ref(null)

const imageStyle = computed(() => {
  const scale = zoom.value
  const w = naturalW.value * scale
  const h = naturalH.value * scale
  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`,
  }
})

watch(
  () => [props.open, props.file],
  () => {
    revokeUrl()
    ready.value = false
    error.value = ''
    offsetX.value = 0
    offsetY.value = 0
    zoom.value = 1
    naturalW.value = 0
    naturalH.value = 0
    if (props.open && props.file) {
      imageUrl.value = URL.createObjectURL(props.file)
    } else {
      imageUrl.value = ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(revokeUrl)

function revokeUrl() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

function stageSize() {
  const el = stageRef.value
  if (!el) return 0
  return Math.min(el.clientWidth, el.clientHeight)
}

function circleRadius() {
  return (stageSize() * CIRCLE_RATIO) / 2
}

function fitZoom() {
  const size = stageSize()
  const r = circleRadius()
  if (!size || !naturalW.value || !naturalH.value || !r) return 1
  // Cover the circle fully
  return Math.max((r * 2) / naturalW.value, (r * 2) / naturalH.value)
}

function clampOffsets() {
  const r = circleRadius()
  const halfW = (naturalW.value * zoom.value) / 2
  const halfH = (naturalH.value * zoom.value) / 2
  const maxX = Math.max(0, halfW - r)
  const maxY = Math.max(0, halfH - r)
  offsetX.value = Math.min(maxX, Math.max(-maxX, offsetX.value))
  offsetY.value = Math.min(maxY, Math.max(-maxY, offsetY.value))
}

function onImageLoad() {
  const img = imgRef.value
  if (!img) return
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight
  const base = fitZoom()
  minZoom.value = base
  zoom.value = base
  offsetX.value = 0
  offsetY.value = 0
  ready.value = true
  clampOffsets()
}

watch(zoom, () => {
  clampOffsets()
})

function onPointerDown(e) {
  if (!ready.value) return
  dragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    ox: offsetX.value,
    oy: offsetY.value,
  }
  e.currentTarget.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!dragging.value || !dragStart.value) return
  offsetX.value = dragStart.value.ox + (e.clientX - dragStart.value.x)
  offsetY.value = dragStart.value.oy + (e.clientY - dragStart.value.y)
  clampOffsets()
}

function onPointerUp() {
  dragging.value = false
  dragStart.value = null
}

function onWheel(e) {
  if (!ready.value) return
  const next = zoom.value * (e.deltaY < 0 ? 1.06 : 0.94)
  zoom.value = Math.min(maxZoom, Math.max(minZoom.value, next))
}

function onCancel() {
  if (props.saving) return
  emit('close')
}

async function onConfirm() {
  if (!ready.value || props.saving) return
  error.value = ''
  try {
    const size = stageSize()
    const r = circleRadius()
    if (!size || !r) throw new Error(t('account.avatar.cropError'))

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error(t('account.avatar.cropError'))

    const img = imgRef.value
    const scale = zoom.value
    // Image center in stage coords = stage center + offset
    const imgCx = size / 2 + offsetX.value
    const imgCy = size / 2 + offsetY.value
    const circleCx = size / 2
    const circleCy = size / 2

    // Top-left of source crop in image pixel space
    const srcX = (circleCx - r - (imgCx - (naturalW.value * scale) / 2)) / scale
    const srcY = (circleCy - r - (imgCy - (naturalH.value * scale) / 2)) / scale
    const srcSize = (r * 2) / scale

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error(t('account.avatar.cropError')))),
        'image/jpeg',
        0.92
      )
    })

    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const normalized = await normalizeUploadImageFile(file)
    emit('confirm', normalized)
  } catch (err) {
    error.value = err?.message || t('account.avatar.cropError')
  }
}
</script>
