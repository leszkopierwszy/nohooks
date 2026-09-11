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
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <DialogTitle class="text-lg font-semibold text-gray-900">
                      Edytuj item
                      <span v-if="itemName" class="font-normal text-gray-500">· {{ itemName }}</span>
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-500">Zmień dane przedmiotu i zapisz.</p>
                  </div>
                  <div
                    v-if="formReady && !loading"
                    class="flex shrink-0 flex-wrap items-center gap-2"
                  >
                    <button
                      type="button"
                      class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="saving || deleting"
                      @click="$emit('close')"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      form="edit-item-modal-form"
                      class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="saving || deleting"
                    >
                      {{ saving ? 'Zapisywanie…' : 'Zapisz zmiany' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="duplicating || saving || deleting"
                      @click="onDuplicate"
                    >
                      {{ duplicating ? 'Powielanie…' : 'Powiel' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="deleting || saving || duplicating"
                      @click="showDeleteConfirm = true"
                    >
                      Usuń item
                    </button>
                  </div>
                </div>
              </div>

              <div class="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-6">
                <p v-if="loading" class="text-sm text-gray-500">Ładowanie formularza…</p>
                <p v-else-if="error" class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

                <ItemForm
                  v-if="formReady"
                  ref="itemFormRef"
                  id-prefix="edit-item-modal"
                  :default-category-id="groupId"
                  editing
                  hide-footer-actions
                  :saving="saving"
                  @submit="onSubmit"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <TransitionRoot as="template" :show="showDeleteConfirm">
    <Dialog class="relative z-60" @close="showDeleteConfirm = false">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/60" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto p-4">
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
            <DialogPanel class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <DialogTitle class="text-lg font-semibold text-gray-900">
                Czy na pewno?
              </DialogTitle>
              <p class="mt-2 text-sm text-gray-600">
                Item
                <span v-if="itemName" class="font-medium text-gray-900">„{{ itemName }}”</span>
                zostanie trwale usunięty. Tej operacji nie można cofnąć.
              </p>
              <p v-if="deleteError" class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {{ deleteError }}
              </p>
              <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  :disabled="deleting"
                  @click="showDeleteConfirm = false"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="deleting"
                  @click="onConfirmDelete"
                >
                  {{ deleting ? 'Usuwanie…' : 'Tak, usuń' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import ItemForm from './ItemForm.vue'
import { apiRequest } from '../api/client'
import { useItemsStore } from '../stores/items'
import { useCollectionStore } from '../stores/collection'

const props = defineProps({
  open: { type: Boolean, default: false },
  itemId: { type: [Number, String], default: null },
  itemName: { type: String, default: '' },
  groupId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved', 'deleted', 'duplicated'])

const itemsStore = useItemsStore()
const collectionStore = useCollectionStore()
const itemFormRef = ref(null)
const saving = ref(false)
const deleting = ref(false)
const duplicating = ref(false)
const loading = ref(false)
const formReady = ref(false)
const error = ref(null)
const showDeleteConfirm = ref(false)
const deleteError = ref(null)

async function loadItemIntoForm() {
  if (!props.itemId) return

  loading.value = true
  formReady.value = false
  error.value = null

  try {
    await Promise.all([
      collectionStore.fetchCollections().catch(() => {}),
      itemsStore.fetchEntities().catch(() => {}),
    ])

    const item = await apiRequest(`/item/${props.itemId}`)
    formReady.value = true
    await nextTick()
    itemFormRef.value?.loadFromItem(item)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadItemIntoForm()
    } else {
      formReady.value = false
      error.value = null
      showDeleteConfirm.value = false
      deleteError.value = null
    }
  }
)

watch(showDeleteConfirm, (visible) => {
  if (!visible) deleteError.value = null
})

async function onDuplicate() {
  if (!props.itemId) return

  duplicating.value = true
  error.value = null

  try {
    const copy = await itemsStore.duplicateItem(Number(props.itemId))
    emit('duplicated', copy)
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    duplicating.value = false
  }
}

async function onSubmit({ payload, fileOptions }) {
  if (!props.itemId) return

  saving.value = true
  error.value = null

  try {
    const updated = await itemsStore.updateItem(Number(props.itemId), payload, fileOptions)
    emit('saved', updated)
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function onConfirmDelete() {
  if (!props.itemId) return

  deleting.value = true
  deleteError.value = null

  try {
    await itemsStore.deleteItem(Number(props.itemId), props.groupId)
    emit('deleted', { id: Number(props.itemId), groupId: props.groupId })
    showDeleteConfirm.value = false
    emit('close')
  } catch (err) {
    deleteError.value = err.message
  } finally {
    deleting.value = false
  }
}
</script>
