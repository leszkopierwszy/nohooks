<template>
  <OverviewBentoCard :title="t('overview.weather.title')" dense class="h-full">
    <div class="flex h-full min-h-[7rem] flex-col justify-between">
      <div class="flex items-start gap-3">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl ring-1 ring-sky-100"
          aria-hidden="true"
        >
          {{ weatherEmoji }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
            {{ temperatureDisplay }}
          </p>
          <p class="text-xs text-gray-500">{{ conditionLabel }}</p>
        </div>
      </div>

      <div class="mt-4 border-t border-gray-100 pt-3">
        <p class="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {{ t('overview.weather.location') }}
        </p>
        <p class="mt-0.5 truncate text-sm font-medium text-gray-900">
          {{ locationLabel }}
        </p>
        <p class="mt-2 text-[10px] leading-snug text-gray-400">
          {{ t('overview.weather.comingSoon') }}
        </p>
      </div>
    </div>
  </OverviewBentoCard>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from '../../composables/useI18n'
import OverviewBentoCard from './OverviewBentoCard.vue'

const STORAGE_KEY = 'nohooks.overview.location'
const DEFAULT_LOCATION = 'Warszawa'

const { t } = useI18n()
const location = ref(DEFAULT_LOCATION)

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored?.trim()) location.value = stored.trim()
  } catch {
    // ignore
  }
})

const locationLabel = computed(() => location.value || t('overview.weather.locationUnknown'))

/** Placeholder — podmienimy po podłączeniu API pogody. */
const temperatureDisplay = computed(() => '—°')
const conditionLabel = computed(() => t('overview.weather.placeholder'))
const weatherEmoji = computed(() => '⛅')
</script>
