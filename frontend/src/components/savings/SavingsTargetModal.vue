<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ targetId ? 'Edytuj target' : 'Nowy target' }}
        </DialogTitle>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label for="st-name" class="block text-sm font-medium text-gray-700">Nazwa</label>
            <input
              id="st-name"
              v-model="form.name"
              type="text"
              required
              maxlength="80"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <SavingsTargetColorPicker v-model="form.color" />

          <div v-if="!isM2m">
            <label for="st-amount" class="block text-sm font-medium text-gray-700">Kwota targetu (PLN)</label>
            <input
              id="st-amount"
              v-model.number="form.amount"
              type="number"
              min="0"
              step="0.01"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>
          <p v-else class="text-sm text-gray-500">
            Kwota jest liczona automatycznie: wynagrodzenie netto − aktywne subskrypcje (jak kafelek M2M).
          </p>

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
              {{ targetId ? 'Zapisz' : 'Dodaj' }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { M2M_SAVINGS_TARGET_ID } from '../../constants/finance'
import {
  DEFAULT_FIXED_TARGET_COLOR,
  DEFAULT_M2M_TARGET_COLOR,
  nextSavingsTargetColor,
} from '../../constants/savingsTargetColors'
import SavingsTargetColorPicker from './SavingsTargetColorPicker.vue'
import { useSavingsTargetsStore } from '../../stores/savingsTargets'

const props = defineProps({
  open: { type: Boolean, required: true },
  targetId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const store = useSavingsTargetsStore()

const form = reactive({ name: '', amount: 0, color: DEFAULT_FIXED_TARGET_COLOR })

const isM2m = computed(() => props.targetId === M2M_SAVINGS_TARGET_ID)

function loadForm() {
  if (!props.targetId) {
    form.name = ''
    form.amount = 0
    form.color = nextSavingsTargetColor(store.targets)
    return
  }
  const t = store.targets.find((x) => x.id === props.targetId)
  if (!t) return
  form.name = t.name
  form.amount = t.amount ?? 0
  form.color = t.color ?? (isM2m.value ? DEFAULT_M2M_TARGET_COLOR : DEFAULT_FIXED_TARGET_COLOR)
}

watch(
  () => [props.open, props.targetId],
  () => {
    if (props.open) loadForm()
  },
  { immediate: true },
)

async function submit() {
  try {
    if (props.targetId) {
      if (isM2m.value) {
        await store.updateTarget(props.targetId, { name: form.name, color: form.color })
      } else {
        await store.updateTarget(props.targetId, {
          name: form.name,
          amount: form.amount,
          color: form.color,
        })
      }
    } else {
      await store.addTarget({ name: form.name, amount: form.amount, color: form.color })
    }
    emit('saved')
    emit('close')
  } catch {
    /* error in store */
  }
}
</script>
