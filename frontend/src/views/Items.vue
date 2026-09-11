<template>
  <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-2xl font-bold tracking-tight text-gray-900">Items</h1>
    <p class="mt-1 text-sm text-gray-600">
      {{ editingId ? 'Edytujesz zapisany item.' : 'Dodaj nowy przedmiot do bazy danych.' }}
    </p>

    <div class="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div
        v-if="editingId"
        class="mb-6 flex items-center justify-between rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
      >
        <span>Edycja itemu #{{ editingId }}</span>
        <button type="button" class="font-medium hover:text-indigo-600" @click="cancelEdit">
          Anuluj
        </button>
      </div>

      <p v-if="itemsStore.error" class="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
        {{ itemsStore.error }}
      </p>

      <ItemForm
        ref="itemFormRef"
        id-prefix="items-page"
        :editing="Boolean(editingId)"
        :saving="saving"
        :submit-label="submitLabel"
        :show-cancel="Boolean(editingId)"
        @submit="onSubmit"
        @cancel="cancelEdit"
      />
    </div>

    <section class="mt-12">
      <h2 class="text-lg font-semibold text-gray-900">Wszystkie itemy</h2>
      <p v-if="itemsStore.loading" class="mt-4 text-sm text-gray-500">Ładowanie…</p>
      <ul v-else-if="itemsStore.items.length" role="list" class="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
        <li
          v-for="item in itemsStore.items"
          :key="item.id"
          :class="[
            'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
            editingId === item.id ? 'bg-indigo-50' : '',
          ]"
        >
          <div class="flex items-start gap-4">
            <ItemImage
              v-if="itemThumb(item)"
              :src="itemThumb(item)"
              :alt="item.name"
              container-class="size-14 shrink-0 rounded-lg border border-gray-200"
              normalize-scale
            />
            <div>
              <p class="font-medium text-gray-900">{{ item.name }}</p>
              <p v-if="item.brand" class="text-sm text-gray-600">
                {{ displayBrandName(item.brand) }}
              </p>
              <p v-if="personaFitLabel(item)" class="text-sm text-gray-500">
                {{ personaFitLabel(item) }}
              </p>
              <p class="text-sm text-gray-500">
                <span v-if="item.category"> · {{ displayClothingTypeName(item.category) ?? item.category }}</span>
                <span v-if="item.season"> · {{ displaySeasonName(item.season) }}</span>
                <span v-if="item.gift" class="text-indigo-600"> · Prezent</span>
              </p>
              <p v-if="!item.gift && item.purchase_price != null" class="text-xs text-gray-400">
                Zakup: {{ formatPurchasePrice(item) }}
              </p>
              <a
                v-if="item.source_url"
                :href="item.source_url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-block text-xs text-indigo-600 hover:text-indigo-500"
              >
                Oryginalna strona →
              </a>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3 sm:justify-end">
            <p v-if="item.current_value != null" class="text-sm font-medium text-gray-700">
              {{ formatPrice(item.current_value) }}
            </p>
            <button
              type="button"
              class="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
              :disabled="duplicatingId === item.id || saving"
              @click="duplicateItem(item)"
            >
              {{ duplicatingId === item.id ? 'Powielanie…' : 'Powiel' }}
            </button>
            <button
              type="button"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              @click="startEdit(item)"
            >
              Edytuj
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-gray-500">Brak itemów. Dodaj pierwszy powyżej.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useItemsStore } from '../stores/items'
import { useCollectionStore } from '../stores/collection'
import ItemForm from '../components/ItemForm.vue'
import { mapItemImageUrls } from '../api/media'
import { displayBrandName } from '../constants/itemBrands'
import { displayClothingTypeName } from '../constants/itemClothingTypes'
import { displaySeasonName } from '../constants/itemSeasons'
import { personaFitLabel as formatPersonaFitLabel } from '../constants/itemPersonaFit'
import { usePersonasStore } from '../stores/personas'
import ItemImage from '../components/ItemImage.vue'
import { formatMoney, formatPln } from '../utils/currency'

const itemsStore = useItemsStore()
const collectionStore = useCollectionStore()
const personasStore = usePersonasStore()

function personaFitLabel(item) {
  return formatPersonaFitLabel(item, personasStore.prims)
}
const itemFormRef = ref(null)
const saving = ref(false)
const duplicatingId = ref(null)
const editingId = ref(null)

const submitLabel = computed(() => {
  if (saving.value) return 'Zapisywanie…'
  return editingId.value ? 'Zapisz zmiany' : 'Dodaj item'
})

function itemThumb(item) {
  return mapItemImageUrls(item)[0] ?? null
}

function formatPrice(value) {
  return formatPln(value)
}

function formatPurchasePrice(item) {
  const currency = item.purchase_currency ?? 'PLN'
  const original = formatMoney(item.purchase_price, currency)

  if (currency === 'PLN' || item.purchase_price_pln == null) {
    return original
  }

  return `${original} (≈ ${formatPln(item.purchase_price_pln)})`
}

function cancelEdit() {
  editingId.value = null
  itemFormRef.value?.reset()
}

function startEdit(item) {
  editingId.value = item.id
  itemFormRef.value?.loadFromItem(item)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function duplicateItem(item) {
  duplicatingId.value = item.id
  itemsStore.error = null

  try {
    const copy = await itemsStore.duplicateItem(item.id)
    editingId.value = copy.id
    itemFormRef.value?.loadFromItem(copy)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    itemsStore.error = err.message
  } finally {
    duplicatingId.value = null
  }
}

async function onSubmit({ payload, fileOptions }) {
  saving.value = true
  itemsStore.error = null

  try {
    if (editingId.value) {
      await itemsStore.updateItem(editingId.value, payload, fileOptions)
    } else {
      await itemsStore.createItem(payload, fileOptions)
    }

    editingId.value = null
    itemFormRef.value?.reset()
  } catch (err) {
    itemsStore.error = err.message
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      itemsStore.fetchItems(),
      collectionStore.fetchCollections(),
    ])
  } catch {
    // error already set in store
  }
})
</script>
