<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto p-4 sm:p-6">
        <div class="flex min-h-full items-center justify-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md rounded-lg bg-white shadow-xl">
              <form @submit.prevent="onSubmit">
                <div class="border-b border-gray-200 px-6 py-4">
                  <DialogTitle class="text-lg font-semibold text-gray-900">
                    Nowa kolekcja
                  </DialogTitle>
                  <p class="mt-1 text-sm text-gray-500">
                    Nazwa trafi do adresu kolekcji (np. „Winter gear” → wintergear).
                  </p>
                </div>

                <div class="px-6 py-6">
                  <p v-if="error" class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {{ error }}
                  </p>

                  <label for="collection-name" class="block text-sm font-medium text-gray-700">
                    Nazwa kolekcji
                  </label>
                  <input
                    id="collection-name"
                    ref="nameInputRef"
                    v-model="name"
                    type="text"
                    required
                    autocomplete="off"
                    placeholder="np. vintage"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p v-if="namePreview" class="mt-2 text-xs text-gray-500">
                    Identyfikator: <span class="font-medium text-gray-700">{{ namePreview }}</span>
                  </p>
                </div>

                <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    :disabled="saving"
                    @click="$emit('close')"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="saving || !name.trim()"
                  >
                    {{ saving ? 'Tworzenie…' : 'Utwórz' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { useCollectionStore } from '../stores/collection'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'created'])

const collectionStore = useCollectionStore()

const name = ref('')
const saving = ref(false)
const error = ref(null)
const nameInputRef = ref(null)

const namePreview = computed(() => normalizeCollectionName(name.value))

function normalizeCollectionName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    name.value = ''
    error.value = null
    requestAnimationFrame(() => nameInputRef.value?.focus())
  }
)

async function onSubmit() {
  const normalized = namePreview.value
  if (!normalized) {
    error.value = 'Podaj nazwę kolekcji.'
    return
  }

  saving.value = true
  error.value = null

  try {
    const collection = await collectionStore.createCollection(name.value.trim())
    emit('created', collection)
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
