<template>
  <FinanceAccountModalShell
    :open="open"
    :title="t('finance.accounts.expense.title')"
    :subtitle="t('finance.accounts.expense.subtitle')"
    @close="$emit('close')"
  >
    <form id="finance-expense-form" class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-xs font-medium text-gray-700" for="exp-account">
          {{ t('finance.accounts.expense.account') }}
        </label>
        <select
          id="exp-account"
          v-model="accountId"
          required
          :class="inputClass"
          :aria-describedby="'exp-account-hint'"
        >
          <option disabled value="">{{ t('finance.accounts.expense.accountPlaceholder') }}</option>
          <option v-for="acc in accounts" :key="acc.id" :value="String(acc.id)">
            {{ accountOptionLabel(acc) }}
          </option>
        </select>
        <p id="exp-account-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.accountHint') }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="exp-amount">
          {{ t('finance.accounts.expense.amount') }}
        </label>
        <input
          id="exp-amount"
          v-model="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          inputmode="decimal"
          :class="inputClass"
          :aria-describedby="'exp-amount-hint'"
        />
        <p id="exp-amount-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.amountHint') }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="exp-category">
          {{ t('finance.accounts.expense.category') }}
        </label>
        <select
          id="exp-category"
          v-model="category"
          :class="inputClass"
          :aria-describedby="'exp-category-hint'"
        >
          <option value="">{{ t('finance.accounts.expense.categoryNone') }}</option>
          <option v-for="cat in MANUAL_EXPENSE_CATEGORIES" :key="cat" :value="cat">
            {{ t(`finance.accounts.expense.categories.${cat}`) }}
          </option>
        </select>
        <p id="exp-category-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.categoryHint') }}
        </p>
      </div>

      <div v-if="isSelectedPet">
        <label class="block text-xs font-medium text-gray-700" for="exp-purchase-type">
          {{ t('finance.accounts.expense.purchaseType') }}
        </label>
        <select
          id="exp-purchase-type"
          v-model="purchaseType"
          :class="inputClass"
          :aria-describedby="'exp-purchase-type-hint'"
        >
          <option value="">{{ t('finance.accounts.expense.purchaseTypeNone') }}</option>
          <option v-for="pt in PET_PURCHASE_TYPES" :key="pt.value" :value="pt.value">
            {{ t(pt.labelKey) }}
          </option>
        </select>
        <p id="exp-purchase-type-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.purchaseTypeHint') }}
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="exp-note">
          {{ t('finance.accounts.expense.note') }}
        </label>
        <textarea
          id="exp-note"
          v-model="note"
          rows="3"
          :placeholder="t('finance.accounts.expense.notePlaceholder')"
          :aria-describedby="'exp-note-hint'"
          class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
        <p id="exp-note-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.noteHint') }}
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        @click="$emit('close')"
      >
        {{ t('finance.accounts.edit.cancel') }}
      </button>
      <button
        type="submit"
        form="finance-expense-form"
        class="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSubmit"
      >
        {{ t('finance.accounts.expense.submit') }}
      </button>
    </template>
  </FinanceAccountModalShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { PET_PURCHASE_TYPES } from '../../constants/animalSpecies'
import { MANUAL_EXPENSE_CATEGORIES } from '../../constants/manualExpenseCategories'
import { useI18n } from '../../composables/useI18n'
import { isPetExpenseAccount } from '../../stores/petExpenseAccounts'
import { parseBalancePln } from '../../utils/financeAccountBalance'

const props = defineProps({
  open: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
  /** Preselect account when opened from a row action. */
  account: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const inputClass =
  'mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

const accountId = ref('')
const amount = ref('')
const category = ref('')
const purchaseType = ref('')
const note = ref('')

const selectedAccount = computed(() => {
  const id = Number(accountId.value)
  if (!Number.isFinite(id)) return null
  return props.accounts.find((a) => Number(a.id) === id) ?? null
})

const isSelectedPet = computed(() => isPetExpenseAccount(selectedAccount.value))

const canSubmit = computed(
  () => Boolean(selectedAccount.value) && parseBalancePln(amount.value) > 0,
)

function accountOptionLabel(acc) {
  const bal = acc.balance ?? ''
  const pet = isPetExpenseAccount(acc) ? ' · pet' : ''
  return `${acc.name}${pet} (${bal})`
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    accountId.value = props.account?.id != null ? String(props.account.id) : ''
    amount.value = ''
    category.value = ''
    purchaseType.value = ''
    note.value = ''
  },
)

watch(isSelectedPet, (pet) => {
  if (!pet) purchaseType.value = ''
})

function submit() {
  if (!canSubmit.value) return
  emit('save', {
    account: selectedAccount.value,
    kind: 'expense',
    amount: amount.value,
    note: note.value,
    category: category.value || null,
    purchase_type: isSelectedPet.value && purchaseType.value ? purchaseType.value : null,
  })
}
</script>
