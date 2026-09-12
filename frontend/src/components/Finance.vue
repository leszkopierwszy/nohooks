<template>
  <div>
    <div class="flex min-w-0 flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {{ t('finance.pageTitle') }}
        </h2>
        <p class="text-sm/6 font-medium text-gray-500">{{ t('finance.pageSubtitle') }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
        @click="expenseOpen = true"
      >
        {{ t('finance.accounts.addExpense') }}
      </button>
    </div>

    <dl class="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="item in flowStatsPadded"
        :key="item.key"
        :class="[item.empty ? '' : item.link ? 'cursor-pointer hover:bg-gray-50' : '', cardClass]"
        :aria-hidden="item.empty ? 'true' : undefined"
        @click="!item.empty && item.link && onStatClick(item)"
      >
        <template v-if="!item.empty">
          <dt class="text-sm/6 font-medium text-gray-500">{{ item.name }}</dt>
          <dd
            :class="[
              item.changeClass ??
                (item.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700'),
              'text-xs font-medium inline-flex items-center gap-1.5',
            ]"
          >
            <span
              v-if="item.colorDot"
              class="size-2 shrink-0 rounded-full"
              :class="item.colorDot"
              aria-hidden="true"
            />
            {{ item.change }}
          </dd>
          <dd class="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">{{ item.value }}</dd>
        </template>
      </div>
    </dl>

    <h3 class="mt-10 text-sm font-semibold text-gray-900">{{ t('finance.assetsHeading') }}</h3>
    <p class="mt-1 text-sm text-gray-500">{{ t('finance.assetsSubtitle') }}</p>

    <dl class="mx-auto mt-4 grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="item in assetStatsPadded"
        :key="item.key"
        :class="[item.empty ? '' : item.link ? 'cursor-pointer hover:bg-gray-50' : '', cardClass]"
        :aria-hidden="item.empty ? 'true' : undefined"
        @click="!item.empty && item.link && onStatClick(item)"
      >
        <template v-if="!item.empty">
          <dt class="text-sm/6 font-medium text-gray-500">{{ item.name }}</dt>
          <dd class="text-xs font-medium text-gray-700">{{ item.change }}</dd>
          <dd class="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">{{ item.value }}</dd>
        </template>
      </div>
    </dl>

    <FinanceExpenseModal
      :open="expenseOpen"
      :accounts="accounts"
      @close="expenseOpen = false"
      @save="onSaveExpense"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FinanceExpenseModal from './finance/FinanceExpenseModal.vue'
import { NET_SALARY_PLN } from '../constants/finance'
import { useFinanceAccountActions } from '../composables/useFinanceAccountActions'
import { useI18n } from '../composables/useI18n'
import { useTimelineStore } from '../stores/timeline'
import { useUserAssetsStore } from '../stores/userAssets'
import { useSavingsTargetsStore } from '../stores/savingsTargets'
import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'
import { MOCK_FINANCE_ASSETS, mockFinanceAssetsTotal } from '../constants/mockFinanceAssets'
import { savingsTargetColorTheme } from '../constants/savingsTargetColors'
import { formatPercentLabel } from '../utils/savingsTarget'
import { mockFinanceAccounts } from '../utils/savingsAssets'

const { t } = useI18n()
const router = useRouter()
const timelineStore = useTimelineStore()
const userAssets = useUserAssetsStore()
const savingsTargets = useSavingsTargetsStore()
const financeStore = useFinanceAccountsStore()
const petAccountsStore = usePetExpenseAccountsStore()
const { adjustBalance } = useFinanceAccountActions()

const expenseOpen = ref(false)
const accounts = computed(() => mockFinanceAccounts())

onMounted(() => {
  timelineStore.fetchPlannedExpenses().catch(() => {})
  savingsTargets.fetchTargets().catch(() => {})
  financeStore.reload()
  petAccountsStore.reload()
})

const GRID_COLUMNS = 4

const cardClass =
  'flex min-h-[7.5rem] flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8'

/** Uzupełnia wiersz pustymi białymi kafelkami zamiast szarego tła siatki. */
function padStatsRow(stats, rowId) {
  const items = stats.map((s) => ({ ...s, key: s.name, empty: false }))
  const remainder = items.length % GRID_COLUMNS
  if (remainder === 0) return items
  const toAdd = GRID_COLUMNS - remainder
  for (let i = 0; i < toAdd; i++) {
    items.push({ empty: true, key: `${rowId}-empty-${i}` })
  }
  return items
}

const plannedExpensesFormatted = computed(
  () =>
    timelineStore.activePlannedExpensesSubtotal.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' PLN / mies.',
)

const m2mTargetPln = computed(() =>
  Math.max(0, NET_SALARY_PLN - timelineStore.activePlannedExpensesSubtotal),
)

const m2mFormatted = computed(() =>
  m2mTargetPln.value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' PLN',
)

const savingsCurrentFormatted = computed(() => savingsTargets.currentSavingsFormatted)

const savingsTargetPercentLabel = computed(() => {
  const pct = savingsTargets.percentOfPrimary(m2mTargetPln.value)
  const summary = savingsTargets.includedAssetsSummary
  const base = formatPercentLabel(pct, savingsTargets.primaryTargetName)
  if (userAssets.assets.length === 0) return base
  return `${base} · ${summary}`
})

const savingsTileAccentClass = computed(
  () => savingsTargetColorTheme(savingsTargets.primaryTargetColor).accent,
)

const mockAssetsFormatted = computed(() =>
  mockFinanceAssetsTotal().toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' PLN',
)

const portfolioCountLabel = computed(() => {
  const n = userAssets.assets.length
  if (n === 0) return t('finance.portfolioEmpty')
  if (n === 1) return t('finance.portfolioOne')
  return t('finance.portfolioMany', { n })
})

const mockCountLabel = computed(() =>
  t('finance.mockAccountsCount', { n: MOCK_FINANCE_ASSETS.length }),
)

const flowStats = computed(() => [
  {
    name: 'Salary',
    value: '12,787.00 PLN',
    change: 'Net Salary (FTE)',
    changeType: 'negative',
    link: true,
  },
  {
    name: 'Planned Expenses',
    value: plannedExpensesFormatted.value,
    change: t('finance.plannedChange'),
    changeType: 'positive',
    link: true,
  },
  {
    name: 'M2M Expected Savings',
    value: m2mFormatted.value,
    change: t('finance.m2mChange'),
    changeType: 'positive',
    link: true,
  },
  {
    name: 'Savings (current)',
    value: savingsCurrentFormatted.value,
    change: savingsTargetPercentLabel.value,
    changeType: 'positive',
    changeClass: savingsTileAccentClass.value,
    colorDot: savingsTargetColorTheme(savingsTargets.primaryTargetColor).dot,
    link: true,
    route: { name: 'FinanceSavings' },
  },
])

const flowStatsPadded = computed(() => padStatsRow(flowStats.value, 'flow'))

const assetStats = computed(() => [
  {
    name: t('finance.myAssets'),
    value: userAssets.totalFormatted,
    change: portfolioCountLabel.value,
    link: true,
    route: { name: 'FinancePortfolio' },
  },
  {
    name: t('finance.mockAccounts'),
    value: mockAssetsFormatted.value,
    change: mockCountLabel.value,
    link: true,
    route: { name: 'FinanceMockAssets' },
  },
])

const assetStatsPadded = computed(() => padStatsRow(assetStats.value, 'assets'))

function goToDetials(name, value) {
  const x = name.replace(/\s+/g, '').toLowerCase()
  router.push({
    name: 'FinanceDetials',
    params: {
      grouplink: x,
    },
    query: {
      n: name,
      v: value,
    },
  })
}

function onStatClick(stat) {
  if (stat.route) {
    router.push(stat.route)
    return
  }
  goToDetials(stat.name, stat.value)
}

function onSaveExpense(payload) {
  if (payload.account) {
    adjustBalance(payload.account, {
      kind: 'expense',
      amount: payload.amount,
      note: payload.note,
      category: payload.category,
      purchase_type: payload.purchase_type,
    })
  }
  expenseOpen.value = false
}
</script>
