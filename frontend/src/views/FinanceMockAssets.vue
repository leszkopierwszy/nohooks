<template>
  <div>
    <FinanceCloseLink />
    <div
      class="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ t('finance.accounts.pageTitle') }}</h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('finance.accounts.pageSubtitle') }}
          <router-link
            :to="{ name: 'FinancePortfolio' }"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {{ t('finance.accounts.portfolioLink') }}
          </router-link>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <p class="text-3xl/10 font-medium tracking-tight tabular-nums text-gray-900">
          {{ totalFormatted }}
        </p>
        <button
          type="button"
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
          @click="openExpense()"
        >
          {{ t('finance.accounts.addExpense') }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          @click="openCreate"
        >
          {{ t('finance.accounts.addAccount') }}
        </button>
      </div>
    </div>

    <div class="sm:flex sm:items-end sm:justify-between">
      <div class="sm:flex-auto">
        <h2 class="text-base font-semibold text-gray-900">{{ t('finance.accounts.filters') }}</h2>
        <p class="mt-2 text-sm text-gray-700">{{ filteredCountLabel }}</p>
      </div>
      <div class="mt-4 flex w-full flex-col gap-4 sm:mt-0 sm:w-auto sm:flex-row sm:items-end">
        <div class="w-full sm:w-56">
          <label for="asset-name-filter" class="block text-sm font-medium text-gray-700">
            {{ t('finance.accounts.fields.name') }}
          </label>
          <input
            id="asset-name-filter"
            v-model="nameFilter"
            type="search"
            :placeholder="t('finance.accounts.nameFilterPlaceholder')"
            class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
          />
        </div>
        <div class="w-full sm:w-44">
          <label for="asset-category-filter" class="block text-sm font-medium text-gray-700">
            {{ t('finance.accounts.fields.category') }}
          </label>
          <select
            id="asset-category-filter"
            v-model="categoryFilter"
            class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
          >
            <option value="">{{ t('finance.accounts.allCategories') }}</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">
              {{ categoryLabel(cat) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="mt-6 flow-root overflow-hidden rounded-lg ring-1 ring-gray-200">
      <table v-if="filteredAssets.length" class="min-w-full divide-y divide-gray-200 text-left">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.fields.name') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.fields.accountNumber') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.fields.accountName') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.fields.category') }}
            </th>
            <th scope="col" class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.fields.balance') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right text-sm font-semibold text-gray-900">
              {{ t('finance.accounts.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="asset in filteredAssets"
            :key="asset.id"
            :class="asset.category === 'pet_expense' ? 'bg-amber-50/40' : ''"
          >
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
              <span class="inline-flex items-center gap-2">
                <AnimalSpeciesIcon
                  v-if="asset.category === 'pet_expense' && asset.species"
                  :species="asset.species"
                  size="sm"
                />
                {{ asset.name }}
                <span
                  v-if="asset.category === 'pet_expense'"
                  class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                >
                  pet
                </span>
              </span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{{ asset.account_number }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{{ asset.account_name }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              {{ categoryLabel(asset.category) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-gray-900">{{ asset.balance }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
              <div class="inline-flex flex-wrap justify-end gap-1">
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                  :title="t('finance.accounts.edit.title')"
                  @click="openEdit(asset)"
                >
                  {{ t('finance.accounts.btnEdit') }}
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-rose-700 hover:bg-rose-50"
                  :title="t('finance.accounts.expense.title')"
                  @click="openExpense(asset)"
                >
                  {{ t('finance.accounts.btnExpense') }}
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-emerald-700 hover:bg-emerald-50"
                  :title="t('finance.accounts.adjust.credit')"
                  @click="openAdjust(asset)"
                >
                  {{ t('finance.accounts.btnAdjust') }}
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-indigo-700 hover:bg-indigo-50"
                  :title="t('finance.accounts.history.title')"
                  @click="openHistory(asset)"
                >
                  {{ t('finance.accounts.btnHistory') }}
                  <span v-if="asset.history_count" class="ml-0.5 tabular-nums text-indigo-500">
                    ({{ asset.history_count }})
                  </span>
                </button>
                <button
                  v-if="!isPetAccount(asset)"
                  type="button"
                  class="rounded-md px-2 py-1 text-rose-700 hover:bg-rose-50"
                  :title="t('finance.accounts.delete')"
                  @click="confirmDelete(asset)"
                >
                  {{ t('finance.accounts.btnDelete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="px-4 py-8 text-center text-sm text-gray-500">
        {{ t('finance.accounts.emptyFiltered') }}
      </p>
    </div>

    <FinanceAccountEditModal
      :open="editOpen"
      :account="activeAccount"
      :is-new="creatingNew"
      @close="closeModals"
      @save="onSaveEdit"
    />
    <FinanceExpenseModal
      :open="expenseOpen"
      :accounts="assets"
      :account="activeAccount"
      @close="closeModals"
      @save="onSaveExpense"
    />
    <FinanceAccountAdjustModal
      :open="adjustOpen"
      :account="activeAccount"
      @close="closeModals"
      @save="onSaveAdjust"
    />
    <FinanceAccountHistoryModal :open="historyOpen" :account="activeAccount" @close="closeModals" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AnimalSpeciesIcon from '../components/AnimalSpeciesIcon.vue'
import FinanceAccountAdjustModal from '../components/finance/FinanceAccountAdjustModal.vue'
import FinanceAccountEditModal from '../components/finance/FinanceAccountEditModal.vue'
import FinanceAccountHistoryModal from '../components/finance/FinanceAccountHistoryModal.vue'
import FinanceExpenseModal from '../components/finance/FinanceExpenseModal.vue'
import FinanceCloseLink from '../components/finance/FinanceCloseLink.vue'
import { useFinanceAccountActions } from '../composables/useFinanceAccountActions'
import { useI18n } from '../composables/useI18n'
import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'
import { formatBalancePln, parseBalancePln } from '../utils/financeAccountBalance'
import { mockFinanceAccounts } from '../utils/savingsAssets'

const { t } = useI18n()
const financeStore = useFinanceAccountsStore()
const petAccountsStore = usePetExpenseAccountsStore()
const { createAccount, updateAccount, adjustBalance, deleteAccount, isPetAccount } =
  useFinanceAccountActions()

const assets = computed(() => mockFinanceAccounts())

onMounted(() => {
  financeStore.reload()
  petAccountsStore.reload()
})

const nameFilter = ref('')
const categoryFilter = ref('')

const editOpen = ref(false)
const expenseOpen = ref(false)
const adjustOpen = ref(false)
const historyOpen = ref(false)
const creatingNew = ref(false)
const activeAccount = ref(null)

const totalFormatted = computed(() => formatBalancePln(financeStore.totalBalance + petTotal.value))

const petTotal = computed(() =>
  petAccountsStore.accounts.reduce((sum, a) => sum + parseBalancePln(a.balance), 0),
)

const categoryOptions = computed(() => {
  const unique = new Set(assets.value.map((a) => a.category))
  return [...unique].sort()
})

const filteredAssets = computed(() => {
  let list = assets.value
  const cat = categoryFilter.value
  if (cat) list = list.filter((a) => a.category === cat)
  const q = nameFilter.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        String(a.account_name ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

function categoryLabel(cat) {
  const key = `finance.accounts.categories.${cat}`
  const label = t(key)
  return label === key ? cat : label
}

const filteredCountLabel = computed(() => {
  const n = filteredAssets.value.length
  const total = assets.value.length
  if (n === total) return t('finance.accounts.countAll', { n })
  return t('finance.accounts.countFiltered', { n, total })
})

function closeModals() {
  editOpen.value = false
  expenseOpen.value = false
  adjustOpen.value = false
  historyOpen.value = false
  creatingNew.value = false
  activeAccount.value = null
}

function openCreate() {
  activeAccount.value = null
  creatingNew.value = true
  editOpen.value = true
}

function openEdit(asset) {
  activeAccount.value = asset
  creatingNew.value = false
  editOpen.value = true
}

function openExpense(asset = null) {
  activeAccount.value = asset
  expenseOpen.value = true
}

function openAdjust(asset) {
  activeAccount.value = asset
  adjustOpen.value = true
}

function openHistory(asset) {
  activeAccount.value = asset
  historyOpen.value = true
}

function onSaveEdit(payload) {
  if (creatingNew.value) {
    createAccount(payload)
  } else if (activeAccount.value) {
    updateAccount(activeAccount.value, payload)
  }
  closeModals()
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
  closeModals()
}

function onSaveAdjust(payload) {
  if (activeAccount.value) {
    adjustBalance(activeAccount.value, payload)
  }
  closeModals()
}

function confirmDelete(asset) {
  if (!window.confirm(t('finance.accounts.deleteConfirm', { name: asset.name }))) return
  deleteAccount(asset)
}
</script>
