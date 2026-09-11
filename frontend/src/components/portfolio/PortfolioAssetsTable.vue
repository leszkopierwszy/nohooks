<template>
  <div>
    <div class="sm:flex sm:items-center sm:justify-between">
      <div class="sm:flex-auto">
        <h2 class="text-base font-semibold text-gray-900">Lista aktywów</h2>
        <p class="mt-2 text-sm text-gray-700">
          Jak planowane wydatki — edycja w oknie dialogowym. Dla kursów i metali: link do strony z ceną, ilość × cena jednostkowa.
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
          Dodaj aktywum
        </button>
      </div>
    </div>

    <p class="mt-4 text-right">
      <router-link
        :to="{ name: 'FinanceMockAssets' }"
        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Demo: mock lista kont →
      </router-link>
    </p>

    <div class="mt-6 flow-root">
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
                    <span v-if="col.id !== 'actions'">{{ col.label }}</span>
                    <span v-else class="sr-only">{{ col.label }}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="asset in store.assets" :key="asset.id">
                  <td
                    v-for="col in visibleColumns"
                    :key="col.id"
                    :class="cellClass(col.id)"
                  >
                    <template v-if="col.id === 'name'">
                      <span class="font-medium text-gray-900">{{ asset.name }}</span>
                    </template>
                    <template v-else-if="col.id === 'category'">
                      {{ asset.category || '—' }}
                    </template>
                    <template v-else-if="col.id === 'tracking'">
                      <FlatBadge
                        :color="asset.tracking_mode === 'unit_price' ? 'indigo' : 'gray'"
                        :label="portfolioTrackingLabel(asset.tracking_mode)"
                      />
                    </template>
                    <template v-else-if="col.id === 'link'">
                      <a
                        v-if="asset.price_url"
                        :href="asset.price_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-indigo-600 hover:text-indigo-500"
                        :title="asset.price_url"
                      >
                        {{ formatAssetLink(asset.price_url) }}
                      </a>
                      <span v-else class="text-gray-400">—</span>
                    </template>
                    <template v-else-if="col.id === 'quantity'">
                      <template v-if="asset.tracking_mode === 'unit_price'">
                        <span class="tabular-nums text-gray-900">{{ asset.quantity }}</span>
                      </template>
                      <span v-else class="text-gray-400">—</span>
                    </template>
                    <template v-else-if="col.id === 'unit_price'">
                      <template v-if="asset.tracking_mode === 'unit_price'">
                        <span class="tabular-nums text-gray-900">{{ formatAssetUnitPrice(asset) }}</span>
                      </template>
                      <span v-else class="text-gray-400">—</span>
                    </template>
                    <template v-else-if="col.id === 'value'">
                      <div class="tabular-nums text-gray-900">{{ formatAssetValue(asset) }}</div>
                      <div
                        v-if="asset.tracking_mode === 'unit_price'"
                        class="mt-0.5 text-xs text-gray-500"
                      >
                        {{ asset.quantity }} × {{ formatAssetUnitPrice(asset) }}
                      </div>
                    </template>
                    <template v-else-if="col.id === 'updated'">
                      {{ formatAssetUpdatedAt(asset) }}
                    </template>
                    <template v-else-if="col.id === 'actions'">
                      <button
                        type="button"
                        class="text-indigo-600 hover:text-indigo-900"
                        @click="openEdit(asset.id)"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        class="ml-3 text-gray-500 hover:text-gray-800"
                        @click="requestRemove(asset.id, asset.name)"
                      >
                        Usuń
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!store.assets.length"
              class="px-4 py-8 text-center text-sm text-gray-500"
            >
              Brak pozycji — kliknij „Dodaj aktywum”, aby dodać pierwszą.
            </p>
          </div>
        </div>
      </div>
    </div>

    <PortfolioAssetModal
      :open="modalOpen"
      :asset-id="editingId"
      @close="modalOpen = false"
      @saved="onSaved"
    />

    <ConfirmDialog
      :open="deleteModalOpen"
      title="Usunąć aktywum?"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      @close="deleteModalOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CheckIcon, ViewColumnsIcon } from '@heroicons/vue/24/outline'
import ConfirmDialog from '../ConfirmDialog.vue'
import FlatBadge from '../FlatBadge.vue'
import PortfolioAssetModal from './PortfolioAssetModal.vue'
import { portfolioTrackingLabel } from '../../constants/portfolioAsset'
import { useUserAssetsStore } from '../../stores/userAssets'
import {
  formatAssetLink,
  formatAssetUnitPrice,
  formatAssetUpdatedAt,
  formatAssetValue,
} from '../../utils/portfolioAsset'

const STORAGE_KEY = 'nohooks.portfolio.visible-columns'

const TABLE_COLUMNS = [
  { id: 'name', label: 'Nazwa', hideable: false },
  { id: 'category', label: 'Kategoria', hideable: true },
  { id: 'tracking', label: 'Wycena', hideable: true },
  { id: 'link', label: 'Link do ceny', hideable: true },
  { id: 'quantity', label: 'Ilość', hideable: true },
  { id: 'unit_price', label: 'Cena jedn.', hideable: true },
  { id: 'value', label: 'Wartość', hideable: false },
  { id: 'updated', label: 'Aktualizacja', hideable: true },
  { id: 'actions', label: 'Akcje', hideable: false },
]

const store = useUserAssetsStore()
const modalOpen = ref(false)
const editingId = ref(null)
const deleteModalOpen = ref(false)
const deleteTarget = ref(null)
const columnVisibility = ref(loadColumnVisibility())

const hideableColumns = computed(() => TABLE_COLUMNS.filter((c) => c.hideable))

const visibleColumns = computed(() =>
  TABLE_COLUMNS.filter((col) => isColumnVisible(col.id)),
)

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return ''
  return `Czy na pewno chcesz usunąć „${deleteTarget.value.label}”?`
})

function defaultVisibility() {
  return Object.fromEntries(TABLE_COLUMNS.map((c) => [c.id, true]))
}

function loadColumnVisibility() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultVisibility()
    const parsed = JSON.parse(raw)
    return { ...defaultVisibility(), ...parsed }
  } catch {
    return defaultVisibility()
  }
}

function saveColumnVisibility() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility.value))
  } catch {
    /* ignore */
  }
}

watch(columnVisibility, saveColumnVisibility, { deep: true })

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

function headerClass(id) {
  if (id === 'actions') return 'py-3.5 pr-4 pl-3 sm:pr-6'
  if (id === 'value' || id === 'quantity' || id === 'unit_price') {
    return 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
  }
  return 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
}

function cellClass(id) {
  const base = 'text-sm whitespace-nowrap'
  if (id === 'actions') return 'py-4 pr-4 pl-3 text-right font-medium sm:pr-6'
  if (id === 'name') return `py-4 pr-3 pl-4 sm:pl-6 ${base}`
  if (id === 'value') return `px-3 py-4 ${base}`
  if (id === 'tracking') return `px-3 py-4 ${base}`
  return `px-3 py-4 text-gray-500 ${base}`
}

function openCreate() {
  editingId.value = null
  modalOpen.value = true
}

function openEdit(id) {
  editingId.value = id
  modalOpen.value = true
}

function onSaved() {
  editingId.value = null
}

function requestRemove(id, label) {
  deleteTarget.value = { id, label }
  deleteModalOpen.value = true
}

function confirmDelete() {
  if (deleteTarget.value?.id) {
    store.removeAsset(deleteTarget.value.id)
  }
  deleteModalOpen.value = false
  deleteTarget.value = null
}
</script>
