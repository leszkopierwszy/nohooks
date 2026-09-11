<template>
  <Dialog :open="open" class="relative z-50" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/60" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ t('growth.complete.title') }}
        </DialogTitle>
        <p v-if="goal" class="mt-1 text-sm text-gray-500">{{ goal.title }}</p>

        <form class="mt-5 space-y-5" @submit.prevent="submit">
          <fieldset>
            <legend class="text-sm font-medium text-gray-900">
              {{ t('growth.complete.moodLegend') }}
            </legend>
            <p class="mt-0.5 text-xs text-gray-500">{{ t('growth.complete.moodHint') }}</p>
            <div class="mt-3 grid grid-cols-5 gap-2">
              <button
                v-for="level in GROWTH_MOOD_LEVELS"
                :key="level.value"
                type="button"
                :class="[
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition',
                  mood === level.value
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                ]"
                @click="mood = level.value"
              >
                <span class="text-2xl" aria-hidden="true">{{ level.emoji }}</span>
                <span class="text-[10px] font-medium leading-tight text-gray-600">
                  {{ t(level.labelKey) }}
                </span>
              </button>
            </div>
          </fieldset>

          <div>
            <label class="block text-sm font-medium text-gray-700" for="growth-complete-note">
              {{ t('growth.complete.note') }}
            </label>
            <textarea
              id="growth-complete-note"
              v-model="note"
              rows="3"
              maxlength="2000"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              @click="$emit('close')"
            >
              {{ t('growth.form.cancel') }}
            </button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              :disabled="mood == null"
            >
              {{ t('growth.complete.submit') }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { GROWTH_MOOD_LEVELS } from '../../constants/growthGoals'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  open: { type: Boolean, default: false },
  goal: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const mood = ref(null)
const note = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    mood.value = props.goal?.mood ?? null
    note.value = props.goal?.completion_note ?? ''
  },
)

function submit() {
  if (mood.value == null) return
  emit('save', { mood: mood.value, completion_note: note.value })
}
</script>
