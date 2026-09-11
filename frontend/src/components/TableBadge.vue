<template>
  <div>
    <div class="sm:flex sm:items-center sm:justify-between">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">Planowane wydatki</h1>
        <p class="mt-2 text-sm text-gray-700">
          Te same wpisy co w Calendar — dodaj tutaj lub w kalendarzu (typ „Zaplanowany wydatek”).
        </p>
      </div>
      <div class="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ViewColumnsIcon class="size-4" aria-hidden="true" />
            Kolumny
          </MenuButton>
          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems
              class="absolute right-0 z-10 mt-2 w-52 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            >
              <div class="border-b border-gray-100 px-3 py-2">
                <p class="text-xs font-medium text-gray-500">Widoczne kolumny</p>
              </div>
              <div class="max-h-64 overflow-y-auto py-1">
                <MenuItem
                  v-for="col in hideableColumns"
                  :key="col.id"
                  v-slot="{ active }"
                  as="template"
                >
                  <button
                    type="button"
                    :class="[
                      active ? 'bg-gray-50' : '',
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700',
                    ]"
                    @click="toggleColumn(col.id)"
                  >
                    <span
                      :class="[
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        isColumnVisible(col.id)
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-300 bg-white',
                      ]"
                    >
                      <CheckIcon v-if="isColumnVisible(col.id)" class="size-3" aria-hidden="true" />
                    </span>
                    {{ col.label }}
                  </button>
                </MenuItem>
              </div>
              <div class="border-t border-gray-100 px-1 py-1">
                <MenuItem v-slot="{ active }" as="template">
                  <button
                    type="button"
                    :class="[
                      active ? 'bg-gray-50' : '',
                      'block w-full px-3 py-2 text-left text-sm text-indigo-600',
                    ]"
                    @click="showAllColumns"
                  >
                    Pokaż wszystkie
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
          @click="openCreate"
        >
          Dodaj wydatek
        </button>
      </div>
    </div>

    <p v-if="timelineStore.error" class="mt-4 text-sm text-red-600">{{ timelineStore.error }}</p>
    <p v-if="timelineStore.plannedLoading" class="mt-4 text-sm text-gray-500">Ładowanie…</p>

    <section
      v-if="expenseRows.length"
      class="mt-6 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-indigo-900">Projekcja wydatków</h2>
          <p class="mt-0.5 text-xs text-indigo-700/80">
            Zaznacz pozycje w tabeli — suma w przeliczeniu na miesiąc (z uwzględnieniem interwału płatności).
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-md shadow-xs ring-1 ring-inset ring-indigo-200">
            <button
              type="button"
              :class="projectionPeriod === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'"
              class="rounded-l-md px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50"
              @click="projectionPeriod = 'month'"
            >
              Miesięcznie
            </button>
            <button
              type="button"
              :class="projectionPeriod === 'year' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'"
              class="rounded-r-md px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50"
              @click="projectionPeriod = 'year'"
            >
              Rocznie
            </button>
          </div>
        </div>
        <div class="text-left sm:text-right">
          <p class="text-2xl font-bold tabular-nums text-indigo-950">
            {{ formatPln(projectionSummary.period) }}
          </p>
          <p class="text-xs text-indigo-700">
            {{ projectionSummary.count }}
            {{ projectionSummary.count === 1 ? 'pozycja' : 'pozycje' }}
            · {{ projectionPeriod === 'year' ? 'rocznie' : 'miesięcznie' }}
            <span v-if="projectionPeriod === 'year'" class="text-indigo-600">
              ({{ formatPln(projectionSummary.monthly) }} / mies.)
            </span>
          </p>
        </div>
      </div>
    </section>

    <PlannedExpenseCategoryTiles
      v-if="expenseRows.length"
      v-model:selected-category="selectedCategory"
      :rows="expenseRows"
    />

    <p
      v-if="selectedCategory && tableVisible"
      class="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600"
    >
      <span>
        Tabela: kategoria
        <span class="font-semibold text-gray-900">{{ selectedCategory }}</span>
        ({{ filteredExpenseRows.length }}
        {{ filteredExpenseRows.length === 1 ? 'pozycja' : 'pozycje' }})
      </span>
    </p>

    <div
      v-if="expenseRows.length"
      class="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3"
    >
      <h2 class="text-sm font-semibold text-gray-900">Lista planowanych wydatków</h2>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        :aria-expanded="tableVisible"
        @click="toggleTableVisible"
      >
        <ChevronUpIcon v-if="tableVisible" class="size-4 text-gray-500" aria-hidden="true" />
        <ChevronDownIcon v-else class="size-4 text-gray-500" aria-hidden="true" />
        {{ tableVisible ? 'Ukryj tabelę' : 'Pokaż tabelę' }}
      </button>
    </div>

    <div v-show="tableVisible" class="mt-4 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow-sm outline-1 outline-black/5 sm:rounded-lg">
            <table class="relative min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    v-for="col in visibleColumns"
                    :key="col.id"
                    scope="col"
                    :class="headerClass(col.id)"
                  >
                    <template v-if="col.id === 'projection'">
                      <input
                        type="checkbox"
                        class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        :checked="allProjectionSelected"
                        :indeterminate.prop="someProjectionSelected && !allProjectionSelected"
                        aria-label="Zaznacz wszystkie do projekcji"
                        @change="toggleAllProjection"
                      />
                    </template>
                    <span v-else-if="col.id !== 'actions'">{{ col.label }}</span>
                    <span v-else class="sr-only">{{ col.label }}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="row in filteredExpenseRows" :key="row.id">
                  <td
                    v-for="col in visibleColumns"
                    :key="col.id"
                    :class="cellClass(col.id)"
                  >
                    <template v-if="col.id === 'projection'">
                      <input
                        type="checkbox"
                        class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        :checked="isInProjection(row.id)"
                        :aria-label="`Projekcja: ${row.plan}`"
                        @change="toggleProjection(row.id)"
                      />
                    </template>
                    <template v-else-if="col.id === 'plan'">{{ row.plan }}</template>
                    <template v-else-if="col.id === 'company'">{{ row.name || '—' }}</template>
                    <template v-else-if="col.id === 'category'">{{ row.category || '—' }}</template>
                    <template v-else-if="col.id === 'status'">
                      <FlatBadge
                        :color="row.status ? 'green' : 'gray'"
                        :label="row.status ? 'Active' : 'Inactive'"
                      />
                    </template>
                    <template v-else-if="col.id === 'interval'">
                      <FlatBadge
                        :color="intervalBadgeColor(row.recurrence)"
                        :label="intervalLabel(row.recurrence)"
                      />
                    </template>
                    <template v-else-if="col.id === 'payment'">
                      {{ formatExpensePayDay(row) }}
                    </template>
                    <template v-else-if="col.id === 'price'">
                      {{ formatExpensePrice(row) }}
                    </template>
                    <template v-else-if="col.id === 'currency'">{{ row.currency }}</template>
                    <template v-else-if="col.id === 'usage'">
                      <div class="text-gray-900">{{ formatUsageFrequency(row) }}</div>
                      <div class="text-xs text-gray-400">
                        ~{{ formatUsageTimes(row) }}/mies.
                      </div>
                    </template>
                    <template v-else-if="col.id === 'value'">
                      <div class="text-gray-900 tabular-nums">
                        {{ formatPln(costPerDay(row), valueDigits(costPerDay(row))) }}
                        <span class="text-xs font-normal text-gray-400">/ dzień</span>
                      </div>
                      <div class="mt-0.5 text-xs tabular-nums text-gray-500">
                        {{ formatPln(costPerUse(row), valueDigits(costPerUse(row))) }}
                        <span class="text-gray-400">/ użycie</span>
                      </div>
                    </template>
                    <template v-else-if="col.id === 'actions'">
                      <button
                        type="button"
                        class="text-indigo-600 hover:text-indigo-900"
                        @click="openEdit(row.id)"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        class="ml-3 text-gray-500 hover:text-gray-800"
                        @click="requestRemove(row.id, row.plan)"
                      >
                        Usuń
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!filteredExpenseRows.length && !timelineStore.plannedLoading"
              class="px-4 py-8 text-center text-sm text-gray-500"
            >
              <template v-if="selectedCategory && expenseRows.length">
                Brak pozycji w kategorii „{{ selectedCategory }}”.
                <button
                  type="button"
                  class="mt-2 block w-full text-indigo-600 hover:text-indigo-500"
                  @click="selectedCategory = null"
                >
                  Pokaż wszystkie
                </button>
              </template>
              <template v-else>
                Brak planowanych wydatków. Dodaj pierwszy — pojawi się też w Calendar.
              </template>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-show="tableVisible" class="mt-8 text-right text-gray-500">
      Aktywne łącznie: {{ subtotal.toFixed(2) }} PLN
      <span class="text-gray-400"> · </span>
      <router-link to="/calendar" class="text-indigo-600 hover:text-indigo-500">Otwórz Calendar</router-link>
    </div>

    <PlannedExpenseModal
      :open="modalOpen"
      :expense="editingEvent"
      @close="modalOpen = false"
      @saved="onSaved"
    />

    <ConfirmDialog
      :open="deleteModalOpen"
      title="Usunąć planowany wydatek?"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      :loading="deleting"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, ViewColumnsIcon } from '@heroicons/vue/24/outline'
import ConfirmDialog from './ConfirmDialog.vue'
import FlatBadge from './FlatBadge.vue'
import PlannedExpenseCategoryTiles from './PlannedExpenseCategoryTiles.vue'
import PlannedExpenseModal from './PlannedExpenseModal.vue'
import { useTimelineStore } from '../stores/timeline'
import {
  plannedExpenseIntervalBadgeColor,
  plannedExpenseIntervalLabel,
} from '../constants/plannedExpenseIntervals'
import {
  activeExpensesSubtotal,
  eventToExpenseRow,
  formatExpensePayDay,
  formatExpensePrice,
  formatUsageFrequency,
} from '../utils/plannedExpense'
import { resolveUsageTimesPerMonth } from '../constants/usageFrequency'
import { rowMatchesCategory } from '../utils/plannedExpenseCategories'
import {
  costPerDay,
  costPerUse,
  formatPln,
  projectionTotals,
} from '../utils/plannedExpenseProjection'

const STORAGE_KEY = 'nohooks.planned-expenses.visible-columns'
const PROJECTION_STORAGE_KEY = 'nohooks.planned-expenses.projection'
const TABLE_VISIBLE_KEY = 'nohooks.planned-expenses.table-visible'

const TABLE_COLUMNS = [
  { id: 'projection', label: 'Projekcja', hideable: true },
  { id: 'plan', label: 'Plan', hideable: false },
  { id: 'company', label: 'Firma', hideable: true },
  { id: 'category', label: 'Kategoria', hideable: true },
  { id: 'status', label: 'Status', hideable: true },
  { id: 'interval', label: 'Interwał', hideable: true },
  { id: 'payment', label: 'Płatność', hideable: true },
  { id: 'price', label: 'Cena', hideable: true },
  { id: 'currency', label: 'Waluta', hideable: true },
  { id: 'usage', label: 'Częstotliwość', hideable: true },
  { id: 'value', label: 'Ocena wartości', hideable: true },
  { id: 'actions', label: 'Akcje', hideable: false },
]

const intervalLabel = plannedExpenseIntervalLabel
const intervalBadgeColor = plannedExpenseIntervalBadgeColor

const timelineStore = useTimelineStore()

const modalOpen = ref(false)
const editingEvent = ref(null)
const deleteModalOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const columnVisibility = ref(loadColumnVisibility())
const projectionPeriod = ref('month')
const projectionSelection = ref(loadProjectionSelection())
const selectedCategory = ref(null)
const tableVisible = ref(loadTableVisible())

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return ''
  return `Czy na pewno chcesz usunąć „${deleteTarget.value.label}”? Wpis zniknie też z Calendar i nie będzie można tego cofnąć.`
})

const hideableColumns = computed(() => TABLE_COLUMNS.filter((c) => c.hideable))

const visibleColumns = computed(() =>
  TABLE_COLUMNS.filter((col) => isColumnVisible(col.id))
)

const expenseRows = computed(() =>
  timelineStore.plannedExpenses.map(eventToExpenseRow)
)

const filteredExpenseRows = computed(() => {
  if (!selectedCategory.value) return expenseRows.value
  return expenseRows.value.filter((row) =>
    rowMatchesCategory(row, selectedCategory.value)
  )
})

const subtotal = computed(() => activeExpensesSubtotal(expenseRows.value))

const projectionSelectedRows = computed(() =>
  expenseRows.value.filter((row) => isInProjection(row.id))
)

const projectionSummary = computed(() => {
  const rows = projectionSelectedRows.value
  const totals = projectionTotals(rows, { period: projectionPeriod.value })
  return { ...totals, count: rows.length }
})

const allProjectionSelected = computed(
  () =>
    expenseRows.value.length > 0 &&
    expenseRows.value.every((row) => isInProjection(row.id))
)

const someProjectionSelected = computed(() =>
  expenseRows.value.some((row) => isInProjection(row.id))
)

function defaultVisibility() {
  return Object.fromEntries(TABLE_COLUMNS.map((c) => [c.id, true]))
}

function loadColumnVisibility() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultVisibility()
    const parsed = JSON.parse(raw)
    const defaults = defaultVisibility()
    return { ...defaults, ...parsed }
  } catch {
    return defaultVisibility()
  }
}

function saveColumnVisibility() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility.value))
  } catch {
    // ignore quota / private mode
  }
}

function isColumnVisible(id) {
  return columnVisibility.value[id] !== false
}

function toggleColumn(id) {
  const col = TABLE_COLUMNS.find((c) => c.id === id)
  if (!col?.hideable) return
  columnVisibility.value = {
    ...columnVisibility.value,
    [id]: !isColumnVisible(id),
  }
}

function showAllColumns() {
  columnVisibility.value = defaultVisibility()
}

function loadTableVisible() {
  try {
    const raw = localStorage.getItem(TABLE_VISIBLE_KEY)
    return raw === 'true'
  } catch {
    return false
  }
}

function saveTableVisible() {
  try {
    localStorage.setItem(TABLE_VISIBLE_KEY, String(tableVisible.value))
  } catch {
    // ignore
  }
}

function toggleTableVisible() {
  tableVisible.value = !tableVisible.value
  saveTableVisible()
}

function loadProjectionSelection() {
  try {
    const raw = localStorage.getItem(PROJECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveProjectionSelection() {
  try {
    localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(projectionSelection.value))
  } catch {
    // ignore
  }
}

function syncProjectionSelection(rows) {
  const next = { ...projectionSelection.value }
  let changed = false
  const validKeys = new Set(rows.map((r) => projectionKey(r.id)))

  for (const row of rows) {
    const key = projectionKey(row.id)
    if (next[key] !== undefined) continue
    if (next[row.id] !== undefined) {
      next[key] = next[row.id]
      delete next[row.id]
    } else {
      next[key] = row.status
    }
    changed = true
  }
  for (const id of Object.keys(next)) {
    if (!validKeys.has(String(id))) {
      delete next[id]
      changed = true
    }
  }
  if (changed) {
    projectionSelection.value = next
  }
}

function projectionKey(id) {
  return String(id)
}

function isInProjection(id) {
  const key = projectionKey(id)
  return projectionSelection.value[key] === true
}

function toggleProjection(id) {
  const key = projectionKey(id)
  projectionSelection.value = {
    ...projectionSelection.value,
    [key]: !isInProjection(id),
  }
}

function toggleAllProjection() {
  const selectAll = !allProjectionSelected.value
  const next = { ...projectionSelection.value }
  for (const row of expenseRows.value) {
    next[projectionKey(row.id)] = selectAll
  }
  projectionSelection.value = next
}

function formatUsageTimes(row) {
  const n = resolveUsageTimesPerMonth(row.usage_frequency, row.usage_times_per_month)
  return Number.isInteger(n) ? n : n.toLocaleString('pl-PL', { maximumFractionDigits: 1 })
}

function valueDigits(value) {
  if (value == null || !Number.isFinite(value)) return 2
  if (value < 0.1) return 3
  if (value < 1) return 2
  return 2
}

function headerClass(id) {
  if (id === 'projection') {
    return 'w-10 py-3.5 pr-2 pl-4 text-center sm:pl-6'
  }
  if (id === 'plan') {
    return 'py-3.5 pr-3 pl-3 text-left text-sm font-semibold text-gray-900'
  }
  if (id === 'actions') {
    return 'py-3.5 pr-4 pl-3 sm:pr-6'
  }
  if (id === 'value' || id === 'usage') {
    return 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
  }
  return 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
}

function cellClass(id) {
  const base = 'text-sm whitespace-nowrap'
  if (id === 'projection') {
    return `w-10 py-4 pr-2 pl-4 text-center sm:pl-6 ${base}`
  }
  if (id === 'plan') {
    return `py-4 pr-3 pl-3 font-medium text-gray-900 ${base}`
  }
  if (id === 'actions') {
    return 'py-4 pr-4 pl-3 text-right font-medium sm:pr-6'
  }
  if (id === 'status' || id === 'interval') {
    return `px-3 py-4 ${base}`
  }
  if (id === 'usage' || id === 'value') {
    return `px-3 py-4 ${base}`
  }
  return `px-3 py-4 text-gray-500 ${base}`
}

watch(columnVisibility, saveColumnVisibility, { deep: true })
watch(tableVisible, saveTableVisible)
watch(projectionSelection, saveProjectionSelection, { deep: true })
watch(expenseRows, (rows) => {
  syncProjectionSelection(rows)
  if (
    selectedCategory.value &&
    !rows.some((r) => rowMatchesCategory(r, selectedCategory.value))
  ) {
    selectedCategory.value = null
  }
}, { immediate: true })

function openCreate() {
  editingEvent.value = null
  modalOpen.value = true
}

function openEdit(id) {
  editingEvent.value = timelineStore.plannedExpenses.find((e) => e.id === id) ?? null
  modalOpen.value = true
}

function requestRemove(id, label) {
  deleteTarget.value = { id, label }
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await timelineStore.deleteEvent(deleteTarget.value.id)
    closeDeleteModal()
  } catch {
    // błąd w store
  } finally {
    deleting.value = false
  }
}

function onSaved() {
  timelineStore.fetchPlannedExpenses().catch(() => {})
}

onMounted(() => {
  timelineStore.fetchPlannedExpenses().catch(() => {})
})
</script>
