<template>
  <div class="mt-4 rounded-lg border border-gray-200/80 bg-white/70 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="text-sm font-semibold text-gray-900">Dane historyczne</h4>
      <button
        type="button"
        class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        :disabled="saving"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Anuluj dodawanie' : '+ Dodaj miesiąc' }}
      </button>
    </div>

    <form
      v-if="showForm"
      class="mt-3 grid gap-3 border-b border-gray-100 pb-4 sm:grid-cols-3"
      @submit.prevent="addRow"
    >
      <div>
        <label for="sph-month" class="block text-xs font-medium text-gray-700">Miesiąc</label>
        <input
          id="sph-month"
          v-model="draftMonth"
          type="month"
          required
          class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
      </div>
      <div>
        <label for="sph-value" class="block text-xs font-medium text-gray-700">Wartość (PLN)</label>
        <input
          id="sph-value"
          v-model.number="draftValue"
          type="number"
          min="0"
          step="0.01"
          required
          class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-sm tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
      </div>
      <div class="flex items-end">
        <button
          type="submit"
          class="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Dodaj do listy
        </button>
      </div>
    </form>

    <div v-if="localRows.length" class="mt-3 overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-xs font-semibold text-gray-500">
            <th class="py-2 pr-4">Miesiąc</th>
            <th class="py-2 pr-4">Wartość</th>
            <th class="py-2 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in localRowsSorted" :key="row.date">
            <td class="py-2 pr-4 text-gray-900">{{ monthLabel(row.date) }}</td>
            <td class="py-2 pr-4 tabular-nums text-gray-700">
              <input
                v-model.number="row.value"
                type="number"
                min="0"
                step="0.01"
                class="w-full max-w-[9rem] rounded-md border-0 py-1 pl-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              />
            </td>
            <td class="py-2 text-right">
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-800"
                @click="removeRow(row.date)"
              >
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="mt-3 text-sm text-gray-500">Brak punktów — dodaj pierwszy miesiąc historyczny.</p>

    <div v-if="localRows.length" class="mt-4 flex justify-end gap-2">
      <button
        type="button"
        class="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        :disabled="saving"
        @click="resetFromProps"
      >
        Cofnij zmiany
      </button>
      <button
        type="button"
        class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        :disabled="saving || !targetId"
        @click="save"
      >
        {{ saving ? 'Zapisywanie…' : 'Zapisz historię' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  dateKeyFromMonthInput,
  monthLabel,
  normalizeChartPoints,
} from '../../utils/savingsProgressChart'

const props = defineProps({
  targetId: { type: String, default: null },
  snapshots: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save'])

const showForm = ref(false)
const draftMonth = ref('')
const draftValue = ref(0)
const localRows = ref([])

const localRowsSorted = computed(() =>
  [...localRows.value].sort((a, b) => b.date.localeCompare(a.date)),
)

function resetFromProps() {
  localRows.value = normalizeChartPoints(props.snapshots).map((p) => ({ ...p }))
}

watch(
  () => props.snapshots,
  () => resetFromProps(),
  { immediate: true, deep: true },
)

function addRow() {
  const date = dateKeyFromMonthInput(draftMonth.value)
  if (!date) return
  const value = Math.max(0, Number(draftValue.value) || 0)
  const rest = localRows.value.filter((r) => r.date !== date)
  localRows.value = [...rest, { date, value }].sort((a, b) => a.date.localeCompare(b.date))
  showForm.value = false
  draftValue.value = 0
}

function removeRow(date) {
  localRows.value = localRows.value.filter((r) => r.date !== date)
}

function save() {
  const snapshots = normalizeChartPoints(localRows.value)
  emit('save', snapshots)
}
</script>
