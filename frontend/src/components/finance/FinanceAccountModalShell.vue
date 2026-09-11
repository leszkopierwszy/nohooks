<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-[60]" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/50" aria-hidden="true" />
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
            <DialogPanel
              class="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white text-xs shadow-xl ring-1 ring-gray-200"
            >
              <div class="border-b border-gray-200 px-6 py-3">
                <DialogTitle class="text-sm font-semibold text-gray-900">
                  {{ title }}
                </DialogTitle>
                <p v-if="subtitle" class="mt-0.5 text-xs text-gray-500">{{ subtitle }}</p>
              </div>

              <div class="max-h-[min(70vh,32rem)] overflow-y-auto px-6 py-4">
                <slot />
              </div>

              <div
                v-if="$slots.footer"
                class="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50/80 px-6 py-3 text-xs"
              >
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

defineEmits(['close'])
</script>
