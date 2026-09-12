<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-[60]" @close="$emit('close')">
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
                class="pointer-events-auto flex h-full w-screen max-w-md flex-col overflow-hidden bg-white text-xs shadow-xl"
              >
                <div class="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
                  <div class="min-w-0 flex-1">
                    <DialogTitle class="text-sm font-semibold text-gray-900">
                      {{ title }}
                    </DialogTitle>
                    <p v-if="subtitle" class="mt-0.5 text-xs text-gray-500">{{ subtitle }}</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    :aria-label="t('finance.accounts.history.close')"
                    @click="$emit('close')"
                  >
                    <XMarkIcon class="size-5" aria-hidden="true" />
                  </button>
                </div>

                <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  <slot />
                </div>

                <div
                  v-if="$slots.footer"
                  class="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-6"
                >
                  <slot name="footer" />
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
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../../composables/useI18n'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

defineEmits(['close'])

const { t } = useI18n()
</script>
