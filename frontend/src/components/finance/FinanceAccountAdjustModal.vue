<template>
  <FinanceAccountModalShell
    :open="open"
    :title="t('finance.accounts.adjust.title')"
    :subtitle="accountSubtitle"
    @close="$emit('close')"
  >
    <form id="finance-account-adjust-form" class="space-y-3" @submit.prevent="submit">
      <fieldset>
        <legend class="block text-xs font-medium text-gray-700">
          {{ t('finance.accounts.adjust.kindLegend') }}
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <label
            v-for="opt in kindOptions"
            :key="opt.value"
            :class="[
              'flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
              kind === opt.value
                ? opt.value === 'credit'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                  : 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
            ]"
          >
            <input v-model="kind" type="radio" :value="opt.value" class="sr-only" />
            {{ opt.label }}
          </label>
        </div>
      </fieldset>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="adj-amount">
          {{ t('finance.accounts.adjust.amount') }}
        </label>
        <input
          id="adj-amount"
          v-model="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          inputmode="decimal"
          :class="inputClass"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700" for="adj-note">
          {{ t('finance.accounts.adjust.note') }}
        </label>
        <textarea
          id="adj-note"
          v-model="note"
          rows="3"
          :placeholder="t('finance.accounts.adjust.notePlaceholder')"
          class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
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
        form="finance-account-adjust-form"
        class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSubmit"
      >
        {{ t('finance.accounts.adjust.submit') }}
      </button>
    </template>
  </FinanceAccountModalShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { useI18n } from '../../composables/useI18n'
import { parseBalancePln } from '../../utils/financeAccountBalance'

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const inputClass =
  'mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

const kind = ref('credit')
const amount = ref('')
const note = ref('')

const kindOptions = computed(() => [
  { value: 'credit', label: t('finance.accounts.adjust.credit') },
  { value: 'debit', label: t('finance.accounts.adjust.debit') },
])

const accountSubtitle = computed(() => {
  if (!props.account) return ''
  return t('finance.accounts.adjust.accountLine', {
    name: props.account.name,
    balance: props.account.balance,
  })
})

const canSubmit = computed(() => parseBalancePln(amount.value) > 0)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    kind.value = 'credit'
    amount.value = ''
    note.value = ''
  },
)

function submit() {
  if (!canSubmit.value) return
  emit('save', {
    kind: kind.value,
    amount: amount.value,
    note: note.value,
  })
}
</script>
