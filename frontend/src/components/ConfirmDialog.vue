<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-[70]" @close="onDialogClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center sm:p-0">
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-150"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            class="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:p-6"
          >
            <div class="sm:flex sm:items-start">
              <div
                :class="[
                  'mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10',
                  isDanger ? 'bg-red-100' : 'bg-amber-100',
                ]"
              >
                <ExclamationTriangleIcon
                  :class="['size-6', isDanger ? 'text-red-600' : 'text-amber-600']"
                  aria-hidden="true"
                />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle as="h3" class="text-base font-semibold text-gray-900">
                  {{ title }}
                </DialogTitle>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    <slot>{{ message }}</slot>
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
              <button
                type="button"
                :disabled="loading"
                :class="[
                  'inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-xs sm:w-auto',
                  isDanger
                    ? 'bg-red-600 hover:bg-red-500 disabled:opacity-50'
                    : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50',
                ]"
                @click="$emit('confirm')"
              >
                {{ loading ? loadingLabel : confirmLabel }}
              </button>
              <button
                type="button"
                :disabled="loading"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                @click="$emit('close')"
              >
                {{ cancelLabel }}
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Potwierdzenie',
  },
  message: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: 'Potwierdź',
  },
  cancelLabel: {
    type: String,
    default: 'Anuluj',
  },
  loadingLabel: {
    type: String,
    default: 'Usuwanie…',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'danger',
    validator: (v) => ['danger', 'warning'].includes(v),
  },
})

const emit = defineEmits(['close', 'confirm'])

const isDanger = computed(() => props.variant === 'danger')

function onDialogClose() {
  if (!props.loading) {
    emit('close')
  }
}
</script>
