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
            <DialogPanel class="w-full max-w-6xl rounded-lg bg-white shadow-xl">
              <div class="border-b border-gray-200 px-6 py-4">
                <DialogTitle class="text-lg font-semibold text-gray-900">
                  Add item
                  <span v-if="collectionName" class="font-normal text-gray-500">· {{ collectionName }}</span>
                </DialogTitle>
                <p class="mt-1 text-sm text-gray-500">Dodaj nowy przedmiot do tej kolekcji.</p>
              </div>

              <div class="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-6">
                <p v-if="error" class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

                <ItemForm
                  ref="itemFormRef"
                  id-prefix="collection-add-item"
                  :default-category-id="groupId"
                  :saving="saving"
                  submit-label="Dodaj item"
                  show-cancel
                  @submit="onSubmit"
                  @cancel="$emit('close')"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
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
import ItemForm from './ItemForm.vue'
import { useItemsStore } from '../stores/items'
import { useCollectionStore } from '../stores/collection'

const props = defineProps({
  open: { type: Boolean, default: false },
  groupId: { type: String, default: null },
  collectionName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'added'])

const itemsStore = useItemsStore()
const collectionStore = useCollectionStore()
const itemFormRef = ref(null)
const saving = ref(false)
const error = ref(null)

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return
  error.value = null
  await collectionStore.fetchCollections().catch(() => {})
  itemFormRef.value?.reset()
})

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
