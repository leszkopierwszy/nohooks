<template>
  <div>
    <FinanceCloseLink />
    <div
      class="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">Moje aktywa</h1>
        <p class="mt-2 text-sm text-gray-700">
          Suma Twoich aktywów (portfel) — dodawaj pozycje i zapisuj stan, żeby śledzić wartość w czasie.
        </p>
      </div>
      <p class="text-3xl/10 font-medium tracking-tight tabular-nums text-gray-900">
        {{ store.totalFormatted }}
      </p>
    </div>

    <div class="sm:flex sm:items-center sm:justify-end">
      <button
        type="button"
        class="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 sm:mt-0"
        @click="snapshot"
      >
        Zapisz stan portfela
      </button>
    </div>

    <PortfolioAssetsTable class="mt-6" />

    <div class="mt-8 xl:hidden">
      <PortfolioValueChart :points="store.chartPoints" plain />
    </div>
  </div>
</template>

<script setup>
import FinanceCloseLink from '../components/finance/FinanceCloseLink.vue'
import PortfolioAssetsTable from '../components/portfolio/PortfolioAssetsTable.vue'
import { useUserAssetsStore } from '../stores/userAssets'
import { useSavingsTargetsStore } from '../stores/savingsTargets'
import { NET_SALARY_PLN } from '../constants/finance'
import { useTimelineStore } from '../stores/timeline'
import PortfolioValueChart from '../components/PortfolioValueChart.vue'

const store = useUserAssetsStore()
const savingsStore = useSavingsTargetsStore()
const timelineStore = useTimelineStore()

async function snapshot() {
  store.recordSnapshot()
  const m2m = Math.max(0, NET_SALARY_PLN - timelineStore.activePlannedExpensesSubtotal)
  await savingsStore.recordPrimaryProgress(m2m).catch(() => {})
}
</script>
