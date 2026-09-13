<template>
  <fieldset>
    <legend class="w-full">
      <span class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-medium text-gray-900">{{ t('display.zoom.title') }}</span>
        <span class="text-sm font-semibold tabular-nums text-gray-900">{{ zoomPercent }}%</span>
      </span>
    </legend>
    <p class="mt-0.5 text-xs text-gray-500">{{ t('display.zoom.hint') }}</p>
    <div class="mt-3">
      <input
        id="app-zoom"
        type="range"
        class="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-indigo-600"
        :min="ZOOM_MIN"
        :max="ZOOM_MAX"
        :step="ZOOM_STEP"
        :value="zoomPercent"
        :aria-valuemin="ZOOM_MIN"
        :aria-valuemax="ZOOM_MAX"
        :aria-valuenow="zoomPercent"
        :aria-valuetext="`${zoomPercent}%`"
        @input="onInput"
      />
      <div class="mt-1.5 flex justify-between text-xs text-gray-400">
        <span>{{ ZOOM_MIN }}%</span>
        <span>{{ ZOOM_DEFAULT }}%</span>
        <span>{{ ZOOM_MAX }}%</span>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from '../../composables/useI18n'
import {
  useDisplayStore,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from '../../stores/display'

const { t } = useI18n()
const displayStore = useDisplayStore()
const { zoomPercent } = storeToRefs(displayStore)

function onInput(event) {
  displayStore.setZoom(event.target.value)
}
</script>
