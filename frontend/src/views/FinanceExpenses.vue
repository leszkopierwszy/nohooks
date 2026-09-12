<template>
  <div>
    <FinanceCloseLink />
    <div
      class="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">
          {{ t('finance.expenses.pageTitle') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('finance.expenses.pageSubtitle') }}
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <div class="text-right">
          <p class="text-sm font-medium text-gray-500">{{ t('finance.expenses.totalLabel') }}</p>
          <p class="text-3xl/10 font-medium tracking-tight tabular-nums text-gray-900">
            {{ summary.total_formatted }}
          </p>
          <p class="mt-1 text-xs text-gray-500">
            {{ t('finance.expenses.monthTotal', { amount: summary.month_total_formatted }) }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
          @click="expenseOpen = true"
        >
          {{ t('finance.accounts.addExpense') }}
        </button>
      </div>
    </div>

    <div class="sm:flex sm:items-end sm:justify-between">
      <div class="sm:flex-auto">
        <h2 class="text-base font-semibold text-gray-900">{{ t('finance.expenses.filters') }}</h2>
        <p class="mt-2 text-sm text-gray-700">{{ filteredCountLabel }}</p>
      </div>
      <div class="mt-4 flex w-full flex-col gap-4 sm:mt-0 sm:w-auto sm:flex-row sm:items-end">
        <div class="w-full sm:w-48">
          <label for="expense-account-filter" class="block text-sm font-medium text-gray-700">
            {{ t('finance.expenses.filterAccount') }}
          </label>
          <select
            id="expense-account-filter"
            v-model="accountFilter"
            class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
          >
            <option value="">{{ t('finance.expenses.allAccounts') }}</option>
            <option v-for="acc in accountOptions" :key="acc.id" :value="String(acc.id)">
              {{ acc.name }}
            </option>
          </select>
        </div>
        <div class="w-full sm:w-48">
          <label for="expense-category-filter" class="block text-sm font-medium text-gray-700">
            {{ t('finance.expenses.filterCategory') }}
          </label>
          <select
            id="expense-category-filter"
            v-model="categoryFilter"
            class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
          >
            <option value="">{{ t('finance.expenses.allCategories') }}</option>
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
        <div class="w-full sm:w-44">
          <label for="expense-search" class="block text-sm font-medium text-gray-700">
            {{ t('finance.expenses.filterSearch') }}
          </label>
          <input
            id="expense-search"
            v-model="searchFilter"
            type="search"
            :placeholder="t('finance.expenses.searchPlaceholder')"
            class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 flow-root overflow-hidden rounded-lg ring-1 ring-gray-200">
      <table v-if="filteredExpenses.length" class="min-w-full divide-y divide-gray-200 text-left">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.expenses.cols.date') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.expenses.cols.account') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.expenses.cols.category') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.expenses.cols.note') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right text-sm font-semibold text-gray-900">
              {{ t('finance.expenses.cols.amount') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="row in filteredExpenses"
            :key="row.id"
            class="cursor-pointer hover:bg-gray-50"
            tabindex="0"
            role="button"
            @click="openExpenseDetail(row)"
            @keydown.enter.prevent="openExpenseDetail(row)"
            @keydown.space.prevent="openExpenseDetail(row)"
          >
            <td class="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-gray-900">
              {{ row.date_label }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
              {{ row.account_name }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
              {{ row.category_label || t('finance.expenses.uncategorized') }}
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-sm text-gray-500">
              <span v-if="row.note">{{ row.note }}</span>
              <span v-else-if="lotterySummary(row)" class="text-amber-800">{{ lotterySummary(row) }}</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-rose-700">
              −{{ row.amount_formatted }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="px-4 py-10 text-center text-sm text-gray-500">
        {{ t('finance.expenses.empty') }}
      </p>
    </div>

    <FinanceExpenseModal
      :open="expenseOpen"
      :accounts="accounts"
      @close="expenseOpen = false"
      @save="onSaveExpense"
    />

    <FinanceExpenseModal
      :open="detailOpen"
      :accounts="accounts"
      :expense="selectedExpense"
      @close="closeExpenseDetail"
      @update="onUpdateExpense"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceCloseLink from '../components/finance/FinanceCloseLink.vue'
import FinanceExpenseModal from '../components/finance/FinanceExpenseModal.vue'
import { useFinanceAccountActions } from '../composables/useFinanceAccountActions'
import { useI18n } from '../composables/useI18n'
import { useExpenseCategoriesStore } from '../stores/expenseCategories'
import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'
import { collectManualExpenses, manualExpensesSummary } from '../utils/manualExpenses'
import { mockFinanceAccounts } from '../utils/savingsAssets'
import { saveManualExpense } from '../utils/saveManualExpense'
import { updateManualExpense } from '../utils/updateManualExpense'
import { formatBalancePln } from '../utils/financeAccountBalance'

const { t } = useI18n()
const financeStore = useFinanceAccountsStore()
const petStore = usePetExpenseAccountsStore()
const categoriesStore = useExpenseCategoriesStore()
const { adjustBalance, updateExpenseEntry, removeExpenseEntry, getAccount } =
  useFinanceAccountActions()

const expenseOpen = ref(false)
const detailOpen = ref(false)
const selectedExpense = ref(null)
const accountFilter = ref('')
const categoryFilter = ref('')
const searchFilter = ref('')
const refreshKey = ref(0)

const accounts = computed(() => mockFinanceAccounts())

onMounted(() => {
  financeStore.reload()
  petStore.reload()
  categoriesStore.fetchCategories().catch(() => {})
})

const allExpenses = computed(() => {
  refreshKey.value
  return collectManualExpenses()
})

const summary = computed(() => manualExpensesSummary(allExpenses.value))

const accountOptions = computed(() => {
  const map = new Map()
  for (const row of allExpenses.value) {
    map.set(String(row.account_id), { id: row.account_id, name: row.account_name })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})

const categoryOptions = computed(() => {
  const map = new Map()
  for (const row of allExpenses.value) {
    if (!row.category) continue
    map.set(row.category, {
      value: row.category,
      label: row.category_label || row.category,
    })
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'pl'))
})

const filteredExpenses = computed(() => {
  let list = allExpenses.value
  if (accountFilter.value) {
    list = list.filter((row) => String(row.account_id) === accountFilter.value)
  }
  if (categoryFilter.value) {
    list = list.filter((row) => row.category === categoryFilter.value)
  }
  const q = searchFilter.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (row) =>
        row.account_name.toLowerCase().includes(q) ||
        String(row.note ?? '').toLowerCase().includes(q) ||
        String(row.category_label ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

const filteredCountLabel = computed(() => {
  const n = filteredExpenses.value.length
  const total = allExpenses.value.length
  const filteredTotal = formatBalancePln(
    filteredExpenses.value.reduce((sum, row) => sum + row.amount, 0),
  )
  if (n === total) return t('finance.expenses.countAll', { n, amount: filteredTotal })
  return t('finance.expenses.countFiltered', { n, total, amount: filteredTotal })
})

function lotterySummary(row) {
  if (Array.isArray(row.lottery_bets) && row.lottery_bets.length) {
    return t('finance.expenses.lotteryBetsShort', { n: row.lottery_bets.length })
  }
  if (Array.isArray(row.lottery_numbers) && row.lottery_numbers.length) {
    return row.lottery_numbers.join(', ')
  }
  return ''
}

function openExpenseDetail(row) {
  selectedExpense.value = row
  detailOpen.value = true
}

function closeExpenseDetail() {
  detailOpen.value = false
  selectedExpense.value = null
}

function onSaveExpense(payload) {
  saveManualExpense(adjustBalance, payload)
  expenseOpen.value = false
  refreshKey.value += 1
}

function onUpdateExpense(payload) {
  updateManualExpense(
    { updateExpenseEntry, removeExpenseEntry, adjustBalance, getAccount },
    payload,
  )
  closeExpenseDetail()
  refreshKey.value += 1
}
</script>
