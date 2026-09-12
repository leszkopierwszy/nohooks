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
        <label class="block text-xs font-medium text-gray-700" for="exp-date">
          {{ t('finance.accounts.expense.date') }}
        </label>
        <DateInputWithCalendar
          v-model="expenseDate"
          input-id="exp-date"
          described-by="exp-date-hint"
          :placeholder="t('finance.accounts.expense.datePlaceholder')"
          :calendar-label="t('finance.accounts.expense.dateCalendar')"
          :prev-month-label="t('finance.accounts.expense.datePrevMonth')"
          :next-month-label="t('finance.accounts.expense.dateNextMonth')"
          :today-label="t('finance.accounts.expense.dateToday')"
          :close-label="t('finance.accounts.history.close')"
          :input-class="inputClass"
          @validity="dateValid = $event"
        />
        <p id="exp-date-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{ t('finance.accounts.expense.dateHint') }}
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
          :disabled="categoriesStore.loading && !categoryOptions.length"
        >
          <option value="">{{ t('finance.accounts.expense.categoryNone') }}</option>
          <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
          <option :value="NEW_CATEGORY_VALUE">
            {{ t('finance.accounts.expense.categoryAddOption') }}
          </option>
        </select>
        <div v-if="isCreatingCategory" class="mt-2 flex gap-2">
          <input
            id="exp-category-new"
            ref="newCategoryInput"
            v-model="newCategory"
            type="text"
            maxlength="64"
            :placeholder="t('finance.accounts.expense.categoryNewPlaceholder')"
            :aria-describedby="'exp-category-hint'"
            :disabled="categoriesStore.saving"
            class="mt-0 min-w-0 flex-1 rounded-md border-0 py-1.5 pl-3 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:opacity-50"
            @keydown.enter.prevent="addCategoryFromInput"
          />
          <button
            type="button"
            class="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!newCategory.trim() || categoriesStore.saving"
            @click="addCategoryFromInput"
          >
            {{
              categoriesStore.saving
                ? t('finance.accounts.expense.categoryAdding')
                : t('finance.accounts.expense.categoryAdd')
            }}
          </button>
        </div>
        <p
          v-if="categoryError"
          class="mt-1 text-[10px] leading-relaxed text-rose-600"
          role="alert"
        >
          {{ categoryError }}
        </p>
        <p id="exp-category-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
          {{
            isCreatingCategory
              ? t('finance.accounts.expense.categoryNewHint')
              : t('finance.accounts.expense.categoryHint')
          }}
        </p>
      </div>

      <div v-if="isLotteryCategory" class="space-y-3 rounded-lg bg-amber-50/60 p-3 ring-1 ring-inset ring-amber-100">
        <div>
          <label class="block text-xs font-medium text-gray-700" for="exp-lottery-system">
            {{ t('finance.accounts.expense.lotterySystem') }}
          </label>
          <select
            id="exp-lottery-system"
            v-model="lotterySystemId"
            :class="inputClass"
            :aria-describedby="'exp-lottery-system-hint'"
          >
            <option v-for="sys in LOTTERY_SYSTEMS" :key="sys.id" :value="sys.id">
              {{ t(`finance.accounts.expense.lotterySystems.${sys.id}`) }}
            </option>
          </select>
          <p id="exp-lottery-system-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
            {{ lotterySystemRuleLabel(selectedLotterySystem, t) }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold text-gray-800">
              {{ t('finance.accounts.expense.lotteryBets') }}
            </p>
            <button
              type="button"
              class="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 shadow-sm hover:bg-amber-50"
              @click="addLotteryBet"
            >
              {{ t('finance.accounts.expense.lotteryAddBet') }}
            </button>
          </div>

          <div
            v-for="(bet, betIndex) in lotteryBets"
            :key="bet.id"
            class="rounded-md bg-white/80 p-2 ring-1 ring-inset ring-amber-100"
          >
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
                {{ t('finance.accounts.expense.lotteryBetLabel', { n: betIndex + 1 }) }}
              </p>
              <button
                v-if="lotteryBets.length > 1"
                type="button"
                class="text-[10px] font-semibold text-rose-700 hover:text-rose-800"
                @click="removeLotteryBet(betIndex)"
              >
                {{ t('finance.accounts.expense.lotteryRemoveBet') }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <input
                v-for="(_, slotIndex) in bet.main"
                :key="`${bet.id}-m-${slotIndex}`"
                v-model="bet.main[slotIndex]"
                type="text"
                inputmode="numeric"
                maxlength="2"
                :aria-label="
                  t('finance.accounts.expense.lotteryMainSlot', {
                    bet: betIndex + 1,
                    n: slotIndex + 1,
                  })
                "
                :placeholder="String(slotIndex + 1)"
                class="h-8 w-8 rounded-md border-0 text-center text-xs font-semibold tabular-nums text-gray-900 ring-1 ring-inset ring-amber-200 placeholder:text-amber-200 focus:ring-2 focus:ring-inset focus:ring-amber-500"
                @input="onLotterySlotInput(bet, 'main', slotIndex, $event)"
              />

              <template v-if="selectedLotterySystem.bonusCount > 0">
                <span class="mx-0.5 text-[10px] font-semibold text-indigo-500" aria-hidden="true">+</span>
                <input
                  v-for="(_, slotIndex) in bet.bonus"
                  :key="`${bet.id}-b-${slotIndex}`"
                  v-model="bet.bonus[slotIndex]"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  :aria-label="
                    t('finance.accounts.expense.lotteryBonusSlot', {
                      bet: betIndex + 1,
                      n: slotIndex + 1,
                    })
                  "
                  :placeholder="String(slotIndex + 1)"
                  class="h-8 w-8 rounded-md border-0 bg-indigo-50 text-center text-xs font-semibold tabular-nums text-indigo-950 ring-1 ring-inset ring-indigo-200 placeholder:text-indigo-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  @input="onLotterySlotInput(bet, 'bonus', slotIndex, $event)"
                />
              </template>
            </div>
          </div>

          <p class="text-[10px] leading-relaxed text-gray-500">
            {{
              t('finance.accounts.expense.lotteryBetsHint', {
                count: selectedLotterySystem.mainCount,
                max: selectedLotterySystem.mainMax,
              })
            }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700" for="exp-lottery-url">
            {{ t('finance.accounts.expense.lotteryDrawUrl') }}
          </label>
          <input
            id="exp-lottery-url"
            v-model="lotteryDrawUrl"
            type="url"
            inputmode="url"
            :placeholder="t('finance.accounts.expense.lotteryDrawUrlPlaceholder')"
            :class="inputClass"
            :aria-describedby="'exp-lottery-url-hint'"
          />
          <p id="exp-lottery-url-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
            {{ t('finance.accounts.expense.lotteryDrawUrlHint') }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700" for="exp-lottery-jackpot">
            {{ t('finance.accounts.expense.lotteryJackpot') }}
          </label>
          <input
            id="exp-lottery-jackpot"
            v-model="lotteryJackpot"
            type="text"
            :placeholder="t('finance.accounts.expense.lotteryJackpotPlaceholder')"
            :class="inputClass"
            :aria-describedby="'exp-lottery-jackpot-hint'"
          />
          <p id="exp-lottery-jackpot-hint" class="mt-1 text-[10px] leading-relaxed text-gray-500">
            {{ t('finance.accounts.expense.lotteryJackpotHint') }}
          </p>
        </div>

        <label class="flex cursor-pointer items-start gap-2">
          <input
            v-model="lotteryTrack"
            type="checkbox"
            class="mt-0.5 size-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span>
            <span class="block text-xs font-medium text-gray-800">
              {{ t('finance.accounts.expense.lotteryTrack') }}
            </span>
            <span class="mt-0.5 block text-[10px] leading-relaxed text-gray-500">
              {{ t('finance.accounts.expense.lotteryTrackHint') }}
            </span>
          </span>
        </label>
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
        :disabled="!canSubmit || categoriesStore.saving"
      >
        {{ t('finance.accounts.expense.submit') }}
      </button>
    </template>
  </FinanceAccountModalShell>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import DateInputWithCalendar from '../DateInputWithCalendar.vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { PET_PURCHASE_TYPES } from '../../constants/animalSpecies'
import {
  DEFAULT_LOTTERY_SYSTEM_ID,
  LOTTERY_SYSTEMS,
  createEmptyLotteryBet,
  lotterySystemById,
  lotterySystemRuleLabel,
  resizeLotteryBet,
  resolveLotteryBet,
} from '../../constants/lotterySystems'
import { useI18n } from '../../composables/useI18n'
import { useExpenseCategoriesStore, LOTTERY_EXPENSE_CATEGORY_SLUG } from '../../stores/expenseCategories'
import { isPetExpenseAccount } from '../../stores/petExpenseAccounts'
import { parseBalancePln } from '../../utils/financeAccountBalance'
import { toIsoDateKey } from '../../utils/dateDmY'

const NEW_CATEGORY_VALUE = '__new__'

const props = defineProps({
  open: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
  /** Preselect account when opened from a row action. */
  account: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()
const categoriesStore = useExpenseCategoriesStore()

const inputClass =
  'mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

const accountId = ref('')
const amount = ref('')
const expenseDate = ref(toIsoDateKey())
const dateValid = ref(true)
const category = ref('')
const newCategory = ref('')
const newCategoryInput = ref(null)
const categoryError = ref('')
const purchaseType = ref('')
const note = ref('')
const lotterySystemId = ref(DEFAULT_LOTTERY_SYSTEM_ID)
const lotteryBets = ref([createEmptyLotteryBet(lotterySystemById(DEFAULT_LOTTERY_SYSTEM_ID))])
const lotteryDrawUrl = ref('')
const lotteryJackpot = ref('')
const lotteryTrack = ref(true)

const categoryOptions = computed(() => categoriesStore.options)
const isCreatingCategory = computed(() => category.value === NEW_CATEGORY_VALUE)
const isLotteryCategory = computed(() => category.value === LOTTERY_EXPENSE_CATEGORY_SLUG)
const selectedLotterySystem = computed(
  () => lotterySystemById(lotterySystemId.value) ?? LOTTERY_SYSTEMS[0],
)

const resolvedLotteryBets = computed(() => {
  if (!isLotteryCategory.value) return []
  const sys = selectedLotterySystem.value
  return lotteryBets.value
    .map((bet) => resolveLotteryBet(bet, sys))
    .filter(Boolean)
})

const selectedAccount = computed(() => {
  const id = Number(accountId.value)
  if (!Number.isFinite(id)) return null
  return props.accounts.find((a) => Number(a.id) === id) ?? null
})

const isSelectedPet = computed(() => isPetExpenseAccount(selectedAccount.value))

const canSubmit = computed(() => {
  if (!selectedAccount.value || parseBalancePln(amount.value) <= 0) return false
  if (!expenseDate.value || !dateValid.value) return false
  if (isCreatingCategory.value && !newCategory.value.trim()) return false
  if (isLotteryCategory.value) {
    if (!lotteryBets.value.length) return false
    if (resolvedLotteryBets.value.length !== lotteryBets.value.length) return false
  }
  return true
})

function accountOptionLabel(acc) {
  const bal = acc.balance ?? ''
  const pet = isPetExpenseAccount(acc) ? ' · pet' : ''
  return `${acc.name}${pet} (${bal})`
}

async function addCategoryFromInput() {
  const label = newCategory.value.trim()
  if (!label || categoriesStore.saving) return

  categoryError.value = ''
  try {
    const option = await categoriesStore.createCategory(label)
    if (!option) return
    category.value = option.value
    newCategory.value = ''
  } catch (err) {
    categoryError.value = err?.message || t('finance.accounts.expense.categoryAddError')
  }
}

function resetLotteryFields() {
  lotterySystemId.value = DEFAULT_LOTTERY_SYSTEM_ID
  lotteryBets.value = [createEmptyLotteryBet(lotterySystemById(DEFAULT_LOTTERY_SYSTEM_ID))]
  lotteryDrawUrl.value = ''
  lotteryJackpot.value = ''
  lotteryTrack.value = true
}

function addLotteryBet() {
  lotteryBets.value = [...lotteryBets.value, createEmptyLotteryBet(selectedLotterySystem.value)]
}

function removeLotteryBet(index) {
  if (lotteryBets.value.length <= 1) return
  lotteryBets.value = lotteryBets.value.filter((_, i) => i !== index)
}

function onLotterySlotInput(bet, pool, slotIndex, event) {
  const max = pool === 'bonus' ? selectedLotterySystem.value.bonusMax : selectedLotterySystem.value.mainMax
  let digits = String(event.target.value ?? '').replace(/\D/g, '')
  if (max >= 10) digits = digits.slice(0, 2)
  else digits = digits.slice(0, 1)

  if (pool === 'bonus') bet.bonus[slotIndex] = digits
  else bet.main[slotIndex] = digits

  // Auto-advance when a complete number for this max is typed.
  const n = Number(digits)
  const complete = digits.length > 0 && Number.isFinite(n) && (max < 10 || digits.length === 2 || n * 10 > max)
  if (!complete) return

  nextTick(() => {
    const inputs = event.target.parentElement?.querySelectorAll('input')
    if (!inputs) return
    const list = [...inputs]
    const current = list.indexOf(event.target)
    if (current >= 0 && current < list.length - 1) list[current + 1].focus()
  })
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    accountId.value = props.account?.id != null ? String(props.account.id) : ''
    amount.value = ''
    expenseDate.value = toIsoDateKey()
    dateValid.value = true
    category.value = ''
    newCategory.value = ''
    categoryError.value = ''
    purchaseType.value = ''
    note.value = ''
    resetLotteryFields()
    categoriesStore.fetchCategories().catch(() => {})
  },
)

watch(isCreatingCategory, async (creating) => {
  if (!creating) {
    newCategory.value = ''
    categoryError.value = ''
    return
  }
  await nextTick()
  newCategoryInput.value?.focus?.()
})

watch(isLotteryCategory, (lottery) => {
  if (!lottery) resetLotteryFields()
  else if (!lotteryBets.value.length) {
    lotteryBets.value = [createEmptyLotteryBet(selectedLotterySystem.value)]
  }
})

watch(lotterySystemId, () => {
  const sys = selectedLotterySystem.value
  lotteryBets.value = lotteryBets.value.map((bet) => resizeLotteryBet(bet, sys))
  if (!lotteryBets.value.length) {
    lotteryBets.value = [createEmptyLotteryBet(sys)]
  }
})

watch(isSelectedPet, (pet) => {
  if (!pet) purchaseType.value = ''
})

async function submit() {
  if (!canSubmit.value || categoriesStore.saving) return

  if (isCreatingCategory.value) {
    categoryError.value = ''
    try {
      const option = await categoriesStore.createCategory(newCategory.value.trim())
      if (!option) return
      category.value = option.value
      newCategory.value = ''
    } catch (err) {
      categoryError.value = err?.message || t('finance.accounts.expense.categoryAddError')
      return
    }
  }

  const resolvedCategory =
    category.value && category.value !== NEW_CATEGORY_VALUE ? category.value : null

  const isLottery = resolvedCategory === LOTTERY_EXPENSE_CATEGORY_SLUG
  const bets = isLottery ? resolvedLotteryBets.value : []
  const firstBet = bets[0] ?? null

  emit('save', {
    account: selectedAccount.value,
    kind: 'expense',
    amount: amount.value,
    note: note.value,
    category: resolvedCategory,
    purchase_type: isSelectedPet.value && purchaseType.value ? purchaseType.value : null,
    date: expenseDate.value,
    lottery_system: isLottery ? lotterySystemId.value : null,
    lottery_bets: bets.length ? bets : null,
    lottery_numbers: firstBet?.numbers ?? null,
    lottery_bonus_numbers: firstBet?.bonus_numbers ?? null,
    lottery_draw_url: isLottery && lotteryDrawUrl.value.trim() ? lotteryDrawUrl.value.trim() : null,
    lottery_jackpot: isLottery && lotteryJackpot.value.trim() ? lotteryJackpot.value.trim() : null,
    lottery_track: isLottery ? lotteryTrack.value : false,
  })
}
</script>
