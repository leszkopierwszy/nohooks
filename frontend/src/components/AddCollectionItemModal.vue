<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-in-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in-out duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <TransitionChild
              as="template"
              enter="transform transition ease-in-out duration-300"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <DialogPanel
                class="pointer-events-auto flex h-full w-screen max-w-2xl flex-col overflow-hidden bg-white shadow-xl"
              >
                <div class="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
                  <div class="min-w-0 flex-1">
                    <DialogTitle class="text-base font-semibold text-gray-900">
                      Add item
                      <span
                        v-if="collectionName"
                        class="font-normal text-gray-500"
                      >· {{ collectionName }}</span>
                    </DialogTitle>
                    <p class="mt-0.5 text-sm text-gray-500">
                      Dodaj nowy przedmiot do tej kolekcji.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Zamknij"
                    @click="$emit('close')"
                  >
                    <XMarkIcon class="size-5" aria-hidden="true" />
                  </button>
                </div>

                <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  <p
                    v-if="error"
                    class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {{ error }}
                  </p>

                  <ItemForm
                    ref="itemFormRef"
                    id-prefix="collection-add-item"
                    :default-category-id="groupId"
                    :saving="saving"
                    submit-label="Dodaj item"
                    show-cancel
                    hide-footer-actions
                    @submit="onSubmit"
                    @cancel="$emit('close')"
                  />
                </div>

                <div
                  class="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-6"
                >
                  <button
                    type="button"
                    class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    :disabled="saving"
                    @click="$emit('close')"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    form="collection-add-item-form"
                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60"
                    :disabled="saving"
                  >
                    {{ saving ? 'Zapisywanie…' : 'Dodaj item' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import ItemForm from './ItemForm.vue'
import { useItemsStore } from '../stores/items'
import { useCollectionStore } from '../stores/collection'
import { usePersonasStore } from '../stores/personas'

const props = defineProps({
  open: { type: Boolean, default: false },
  groupId: { type: String, default: null },
  collectionName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'added'])

const itemsStore = useItemsStore()
const collectionStore = useCollectionStore()
const personasStore = usePersonasStore()
const itemFormRef = ref(null)
const saving = ref(false)
const error = ref(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    error.value = null
    await Promise.all([
      collectionStore.fetchCollections().catch(() => {}),
      personasStore.fetchPersonas().catch(() => {}),
    ])
    itemFormRef.value?.reset()
  }
)

async function onSubmit({ payload, fileOptions }) {
  if (!props.groupId) return
  saving.value = true
  error.value = null
  try {
    await itemsStore.createItem(payload, fileOptions)
    emit('added')
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
