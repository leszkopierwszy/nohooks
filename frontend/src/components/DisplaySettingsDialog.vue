<template>
  <Dialog :open="open" class="relative z-50" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-900/40" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5"
      >
        <DialogTitle class="text-base font-semibold text-gray-900">
          {{ t('display.dialog.title') }}
        </DialogTitle>
        <p class="mt-1 text-sm text-gray-500">{{ t('display.dialog.subtitle') }}</p>

        <div class="mt-6 space-y-6">
          <DisplayThemeSettings />
          <DisplayLocaleSettings />
          <DisplayZoomSettings />
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <RouterLink
            to="/account"
            class="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            @click="$emit('close')"
          >
            {{ t('display.dialog.accountLink') }}
          </RouterLink>
          <button
            type="button"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            @click="$emit('close')"
          >
            {{ t('display.dialog.done') }}
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { RouterLink } from 'vue-router'
import DisplayThemeSettings from './account/DisplayThemeSettings.vue'
import DisplayLocaleSettings from './account/DisplayLocaleSettings.vue'
import DisplayZoomSettings from './account/DisplayZoomSettings.vue'
import { useI18n } from '../composables/useI18n'

defineProps({
  open: Boolean,
})

defineEmits(['close'])

const { t } = useI18n()
</script>
