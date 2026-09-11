<template>
  <fieldset>
    <legend class="text-sm font-medium text-gray-900">{{ t('display.zoom.title') }}</legend>
    <p class="mt-0.5 text-xs text-gray-500">{{ t('display.zoom.hint') }}</p>
    <div class="mt-3 grid grid-cols-3 gap-2">
      <label
        v-for="opt in ZOOM_OPTIONS"
        :key="opt.value"
        :class="[
          'flex cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold transition-colors',
          zoomPercent === opt.value
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
        ]"
      >
        <input
          type="radio"
          name="app-zoom"
          class="sr-only"
          :value="opt.value"
          :checked="zoomPercent === opt.value"
          @change="displayStore.setZoom(opt.value)"
        />
        {{ opt.label }}
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from '../../composables/useI18n'
import { useDisplayStore, ZOOM_OPTIONS } from '../../stores/display'

const { t } = useI18n()
const displayStore = useDisplayStore()
const { zoomPercent } = storeToRefs(displayStore)
</script>
