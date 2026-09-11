<template>
  <div class="mx-auto max-w-7xl">
    <header class="border-b border-gray-200/80 pb-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {{ t('nav.overview') }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-500">{{ t('overview.subtitle') }}</p>
      </div>
    </header>

    <p v-if="timelineStore.error" class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ timelineStore.error }}
    </p>

    <OverviewGridStack
      class="mt-8"
      :layout="layout"
      :grid-label="t('overview.layout.gridLabel')"
    >
      <template #day>
        <OverviewDayAgendaCard
          tall
          :selected-date="selectedDate"
          :events="selectedDayEvents"
          @open-event="openCalendarEvent"
        />
      </template>

      <template #savings>
        <OverviewSavingsPeekCard />
      </template>

      <template #weather>
        <OverviewWeatherCard />
      </template>
    </OverviewGridStack>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useOverviewCalendar } from '../composables/useOverviewCalendar'
import { useOverviewTileLayout } from '../composables/useOverviewTileLayout'
import { useSavingsTargetsStore } from '../stores/savingsTargets'
import { useTimelineStore } from '../stores/timeline'
import OverviewDayAgendaCard from '../components/overview/OverviewDayAgendaCard.vue'
import OverviewGridStack from '../components/overview/OverviewGridStack.vue'
import OverviewSavingsPeekCard from '../components/overview/OverviewSavingsPeekCard.vue'
import OverviewWeatherCard from '../components/overview/OverviewWeatherCard.vue'

const { t } = useI18n()
const router = useRouter()
const savingsTargets = useSavingsTargetsStore()

const { layout } = useOverviewTileLayout()

const { timelineStore, selectedDate, selectedDayEvents, loadEvents } = useOverviewCalendar()

onMounted(() => {
  loadEvents().catch(() => {})
  timelineStore.fetchPlannedExpenses().catch(() => {})
  savingsTargets.fetchTargets().catch(() => {})
})

function openCalendarEvent(event) {
  router.push({
    name: 'Calendar',
    query: {
      date: selectedDate.value,
      eventId: event.id,
    },
  })
}
</script>
