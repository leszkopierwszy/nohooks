<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel class="max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ editingId ? 'Edytuj wydatek' : 'Nowy planowany wydatek' }}
        </DialogTitle>
        <p class="mt-1 text-sm text-gray-500">
          Pojawi się w Finance i w Calendar według wybranego interwału (miesiąc, kwartał, pół roku, rok).
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label for="pe-plan" class="block text-sm font-medium text-gray-700">Plan / nazwa</label>
            <input
              id="pe-plan"
              v-model="form.plan"
              type="text"
              required
              maxlength="255"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div>
            <label for="pe-company" class="block text-sm font-medium text-gray-700">Firma</label>
            <input
              id="pe-company"
              v-model="form.name"
              type="text"
              maxlength="255"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div>
            <label for="pe-category" class="block text-sm font-medium text-gray-700">Kategoria</label>
            <input
              id="pe-category"
              v-model="form.category"
              type="text"
              maxlength="64"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div>
            <label for="pe-interval" class="block text-sm font-medium text-gray-700">Interwał</label>
            <select
              id="pe-interval"
              v-model="form.recurrence"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option v-for="opt in PLANNED_EXPENSE_INTERVALS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label for="pe-date" class="block text-sm font-medium text-gray-700">
              Data pierwszej płatności
            </label>
            <input
              id="pe-date"
              v-model="form.event_date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label for="pe-price" class="block text-sm font-medium text-gray-700">Cena</label>
              <input
                id="pe-price"
                v-model="form.price"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label for="pe-currency" class="block text-sm font-medium text-gray-700">Waluta</label>
              <select
                id="pe-currency"
                v-model="form.currency"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="pe-usage" class="block text-sm font-medium text-gray-700">
                Częstotliwość korzystania
              </label>
              <select
                id="pe-usage"
                v-model="form.usage_frequency"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              >
                <option v-for="opt in USAGE_FREQUENCIES" :key="opt.value" :value="opt.value">
                  {{ opt.label }} (~{{ opt.timesPerMonth }}/mies.)
                </option>
              </select>
            </div>
            <div>
              <label for="pe-usage-custom" class="block text-sm font-medium text-gray-700">
                Użyć / mies. (opcjonalnie)
              </label>
              <input
                id="pe-usage-custom"
                v-model="form.usage_times_per_month"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="np. 15"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              v-model="form.status"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Aktywny
          </label>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              @click="$emit('close')"
            >
              Anuluj
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {{ saving ? 'Zapisywanie…' : editingId ? 'Zapisz' : 'Dodaj' }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useTimelineStore } from '../stores/timeline'
import { PLANNED_EXPENSE_INTERVALS } from '../constants/plannedExpenseIntervals'
import { USAGE_FREQUENCIES } from '../constants/usageFrequency'
import { expenseRowToPayload, eventToExpenseRow } from '../utils/plannedExpense'
import { toDateKey } from '../utils/calendarGrid'

const props = defineProps({
  open: Boolean,
  expense: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'saved'])

const timelineStore = useTimelineStore()

const editingId = ref(null)
const saving = ref(false)
const error = ref(null)

const emptyForm = () => ({
  plan: '',
  name: '',
  category: '',
  event_date: toDateKey(new Date()),
  price: '',
  currency: 'PLN',
  status: true,
  recurrence: 'monthly',
  usage_frequency: 'monthly',
  usage_times_per_month: '',
})

const form = reactive(emptyForm())

watch(
  () => [props.open, props.expense],
  () => {
    if (!props.open) return
    error.value = null
    if (props.expense) {
      const row = eventToExpenseRow(props.expense)
      editingId.value = row.id
      Object.assign(form, {
        plan: row.plan,
        name: row.name,
        category: row.category,
        event_date: row.event_date,
        price: row.price,
        currency: row.currency,
        status: row.status,
        recurrence: row.recurrence || 'monthly',
        usage_frequency: row.usage_frequency || 'monthly',
        usage_times_per_month: row.usage_times_per_month ?? '',
      })
    } else {
      editingId.value = null
      Object.assign(form, emptyForm())
    }
  },
  { immediate: true }
)

async function submit() {
  saving.value = true
  error.value = null
  try {
    const payload = expenseRowToPayload({ ...form, id: editingId.value })
    if (editingId.value) {
      await timelineStore.updateEvent(editingId.value, payload)
    } else {
      await timelineStore.createEvent(payload)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
