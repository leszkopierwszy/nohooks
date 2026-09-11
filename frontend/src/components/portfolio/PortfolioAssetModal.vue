<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel class="max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ assetId ? 'Edytuj aktywum' : 'Nowe aktywum' }}
        </DialogTitle>
        <p class="mt-1 text-sm text-gray-500">
          Wartość możesz wpisać ręcznie albo policzyć z ilości × cena jednostkowa (np. po kursie ze strony).
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label for="pa-name" class="block text-sm font-medium text-gray-700">Nazwa</label>
            <input
              id="pa-name"
              v-model="form.name"
              type="text"
              required
              maxlength="120"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <div>
            <label for="pa-category" class="block text-sm font-medium text-gray-700">Kategoria</label>
            <input
              id="pa-category"
              v-model="form.category"
              type="text"
              maxlength="64"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <span class="block text-sm font-medium text-gray-700">Sposób wyceny</span>
            <div class="mt-2 space-y-2">
              <label
                v-for="opt in PORTFOLIO_TRACKING_MODES"
                :key="opt.value"
                class="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
              >
                <input
                  v-model="form.tracking_mode"
                  type="radio"
                  :value="opt.value"
                  class="border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <template v-if="form.tracking_mode === 'unit_price'">
            <div>
              <label for="pa-url" class="block text-sm font-medium text-gray-700">
                Link do strony z ceną
              </label>
              <div class="mt-1 flex gap-2">
                <input
                  id="pa-url"
                  v-model="form.price_url"
                  type="url"
                  inputmode="url"
                  placeholder="https://…"
                  class="block min-w-0 flex-1 rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
                <button
                  v-if="form.price_url.trim()"
                  type="button"
                  class="shrink-0 rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  @click="openPricePage"
                >
                  Otwórz
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Otwórz stronę, skopiuj aktualną cenę jednostkową i wpisz ją poniżej.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="pa-qty" class="block text-sm font-medium text-gray-700">Ilość</label>
                <input
                  id="pa-qty"
                  v-model.number="form.quantity"
                  type="number"
                  min="0"
                  step="any"
                  required
                  class="mt-1 block w-full rounded-md border-0 py-2 pl-3 tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label for="pa-unit" class="block text-sm font-medium text-gray-700">Cena jednostkowa</label>
                <input
                  id="pa-unit"
                  v-model.number="form.unit_price"
                  type="number"
                  min="0"
                  step="0.0001"
                  required
                  class="mt-1 block w-full rounded-md border-0 py-2 pl-3 tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label for="pa-currency" class="block text-sm font-medium text-gray-700">Waluta</label>
              <select
                id="pa-currency"
                v-model="form.currency"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <p class="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
              Wartość pozycji:
              <span class="font-semibold tabular-nums">{{ previewValue }}</span>
            </p>
          </template>

          <template v-else>
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2">
                <label for="pa-value" class="block text-sm font-medium text-gray-700">Wartość</label>
                <input
                  id="pa-value"
                  v-model.number="form.value"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="mt-1 block w-full rounded-md border-0 py-2 pl-3 tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label for="pa-currency-manual" class="block text-sm font-medium text-gray-700">Waluta</label>
                <select
                  id="pa-currency-manual"
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
          </template>

          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

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
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {{ assetId ? 'Zapisz' : 'Dodaj' }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { PORTFOLIO_TRACKING_MODES } from '../../constants/portfolioAsset'
import { formatMoney } from '../../utils/currency'
import { useUserAssetsStore } from '../../stores/userAssets'

const props = defineProps({
  open: { type: Boolean, required: true },
  assetId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const store = useUserAssetsStore()
const formError = ref(null)

const emptyForm = () => ({
  name: '',
  category: '',
  tracking_mode: 'manual',
  price_url: '',
  quantity: 1,
  unit_price: 0,
  value: 0,
  currency: 'PLN',
})

const form = reactive(emptyForm())

const previewValue = computed(() => {
  const q = Math.max(0, Number(form.quantity) || 0)
  const p = Math.max(0, Number(form.unit_price) || 0)
  return formatMoney(q * p, form.currency)
})

function loadForm() {
  formError.value = null
  if (!props.assetId) {
    Object.assign(form, emptyForm())
    return
  }
  const a = store.assets.find((x) => x.id === props.assetId)
  if (!a) {
    Object.assign(form, emptyForm())
    return
  }
  Object.assign(form, {
    name: a.name,
    category: a.category,
    tracking_mode: a.tracking_mode,
    price_url: a.price_url,
    quantity: a.quantity,
    unit_price: a.unit_price,
    value: a.value,
    currency: a.currency,
  })
}

watch(
  () => [props.open, props.assetId],
  () => {
    if (props.open) loadForm()
  },
  { immediate: true },
)

function openPricePage() {
  const url = form.price_url.trim()
  if (!url) return
  try {
    window.open(new URL(url).href, '_blank', 'noopener,noreferrer')
  } catch {
    formError.value = 'Nieprawidłowy adres URL.'
  }
}

function submit() {
  formError.value = null
  if (form.tracking_mode === 'unit_price' && !form.price_url.trim()) {
    formError.value = 'Podaj link do strony z ceną jednostkową.'
    return
  }

  const payload = {
    name: form.name,
    category: form.category,
    tracking_mode: form.tracking_mode,
    price_url: form.price_url,
    quantity: form.quantity,
    unit_price: form.unit_price,
    value: form.value,
    currency: form.currency,
  }

  if (props.assetId) {
    store.updateAsset(props.assetId, payload)
  } else {
    store.addAsset(payload)
  }
  emit('saved')
  emit('close')
}
</script>
