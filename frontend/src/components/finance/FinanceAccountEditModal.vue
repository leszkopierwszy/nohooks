<template>
  <FinanceAccountModalShell
    :open="open"
    :title="isNew ? t('finance.accounts.edit.createTitle') : t('finance.accounts.edit.title')"
    :subtitle="modalSubtitle"
    @close="$emit('close')"
  >
    <form id="finance-account-edit-form" class="space-y-3" @submit.prevent="submit">
      <p
        v-if="formError"
        class="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
        role="alert"
      >
        {{ formError }}
      </p>

      <p
        v-if="isPet"
        class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
      >
        {{ t('finance.accounts.edit.petHint') }}
      </p>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="acc-name">
          {{ t('finance.accounts.fields.name') }}
        </label>
        <input
          id="acc-name"
          v-model="form.name"
          required
          autocomplete="off"
          :class="inputClass"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="acc-num">
          {{ t('finance.accounts.fields.accountNumber') }}
        </label>
        <input
          id="acc-num"
          v-model="form.account_number"
          autocomplete="off"
          :placeholder="t('finance.accounts.edit.accountNumberPlaceholder')"
          :class="inputClass"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="acc-label">
          {{ t('finance.accounts.fields.accountName') }}
        </label>
        <input
          id="acc-label"
          v-model="form.account_name"
          autocomplete="off"
          :placeholder="t('finance.accounts.edit.accountNamePlaceholder')"
          :class="inputClass"
        />
      </div>

      <div v-if="!isPet">
        <label class="block text-xs font-medium text-gray-700" for="acc-cat">
          {{ t('finance.accounts.fields.category') }}
        </label>
        <select id="acc-cat" v-model="form.category" :class="inputClass">
          <option v-for="cat in FINANCE_ACCOUNT_CATEGORIES" :key="cat" :value="cat">
            {{ t(`finance.accounts.categories.${cat}`) }}
          </option>
        </select>
      </div>

      <div v-if="!isNew && account" class="rounded-lg bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200">
        <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {{ t('finance.accounts.fields.balance') }}
        </p>
        <p class="mt-1 text-sm font-semibold tabular-nums text-gray-900">{{ account.balance }}</p>
        <p class="mt-1 text-[10px] text-gray-500">{{ t('finance.accounts.edit.balanceHint') }}</p>
      </div>

      <div v-if="isNew">
        <label class="block text-xs font-medium text-gray-700" for="acc-balance">
          {{ t('finance.accounts.fields.initialBalance') }}
        </label>
        <input
          id="acc-balance"
          v-model="form.balance"
          type="number"
          step="0.01"
          min="0"
          inputmode="decimal"
          :class="inputClass"
        />
        <p class="mt-1 text-[10px] text-gray-500">{{ t('finance.accounts.edit.initialBalanceHint') }}</p>
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
        form="finance-account-edit-form"
        class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!form.name.trim()"
      >
        {{ t('finance.accounts.edit.save') }}
      </button>
    </template>
  </FinanceAccountModalShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { FINANCE_ACCOUNT_CATEGORIES } from '../../constants/financeAccountCategories'
import { useI18n } from '../../composables/useI18n'
import { isPetExpenseAccount } from '../../stores/petExpenseAccounts'
import { parseBalancePln } from '../../utils/financeAccountBalance'

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
  isNew: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const inputClass =
  'mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

const formError = ref('')

const isPet = computed(() => isPetExpenseAccount(props.account) && !props.isNew)

const modalSubtitle = computed(() => {
  if (props.isNew) return t('finance.accounts.edit.createSubtitle')
  if (isPet.value) return t('finance.accounts.edit.petSubtitle')
  return t('finance.accounts.edit.editSubtitle')
})

const form = reactive({
  name: '',
  account_number: '',
  account_name: '',
  category: 'fiat',
  balance: '0',
})

watch(
  () => [props.open, props.account, props.isNew],
  () => {
    formError.value = ''
    if (!props.open) return
    if (props.isNew) {
      form.name = ''
      form.account_number = ''
      form.account_name = ''
      form.category = 'fiat'
      form.balance = '0'
      return
    }
    const a = props.account
    form.name = a?.name ?? ''
    form.account_number = a?.account_number ?? ''
    form.account_name = a?.account_name ?? ''
    form.category = a?.category === 'pet_expense' ? 'fiat' : (a?.category ?? 'fiat')
    form.balance = '0'
  },
  { immediate: true },
)

function submit() {
  const name = form.name.trim()
  if (!name) {
    formError.value = t('finance.accounts.edit.nameRequired')
    return
  }
  const payload = {
    name,
    account_number: form.account_number.trim(),
    account_name: form.account_name.trim(),
  }
  if (!isPet.value) payload.category = form.category
  if (props.isNew) payload.balance = parseBalancePln(form.balance)
  emit('save', payload)
}
</script>
