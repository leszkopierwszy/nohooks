<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel class="max-h-[min(90vh,42rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ editingId ? 'Edytuj wpis' : 'Nowy wpis' }}
        </DialogTitle>

        <form class="mt-6 space-y-4" @submit.prevent="$emit('submit')">
          <div>
            <label for="timeline-type" class="block text-sm font-medium text-gray-700">Typ</label>
            <select
              id="timeline-type"
              v-model="form.type"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option v-for="t in TIMELINE_EVENT_TYPES_FORM" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>

          <div v-if="form.type === 'goal_work'" class="space-y-4 rounded-lg bg-stone-50 p-4 ring-1 ring-inset ring-stone-200">
            <div>
              <label for="timeline-goal" class="block text-sm font-medium text-gray-700">Cel rozwoju</label>
              <select
                id="timeline-goal"
                v-model="form.growth_goal_id"
                required
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                @change="onGoalChange"
              >
                <option value="" disabled>Wybierz cel…</option>
                <option v-for="goal in activeGoals" :key="goal.id" :value="goal.id">
                  {{ goal.title }}
                </option>
              </select>
              <p v-if="!activeGoals.length" class="mt-1 text-xs text-amber-700">
                Brak aktywnych celów — dodaj cel w sekcji Rozwój.
              </p>
            </div>
            <div>
              <label for="timeline-work-minutes" class="block text-sm font-medium text-gray-700">
                Czas pracy (minuty)
              </label>
              <input
                id="timeline-work-minutes"
                v-model.number="form.work_minutes"
                type="number"
                min="1"
                max="1440"
                required
                placeholder="np. 90"
                class="mt-1 block w-full max-w-[10rem] rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
              <p v-if="form.work_minutes > 0" class="mt-1 text-xs text-gray-500">
                ≈ {{ formatWorkDuration(form.work_minutes) }}
              </p>
            </div>
          </div>

          <div>
            <label for="timeline-label" class="block text-sm font-medium text-gray-700">
              {{
                form.type === 'planned_expense'
                  ? 'Plan / nazwa'
                  : form.type === 'goal_work'
                    ? 'Opis sesji (opcjonalnie)'
                    : 'Etykieta'
              }}
            </label>
            <input
              id="timeline-label"
              v-model="form.label"
              type="text"
              :required="form.type !== 'goal_work'"
              maxlength="255"
              :placeholder="
                form.type === 'planned_expense'
                  ? 'np. Premium Individual'
                  : form.type === 'goal_work'
                    ? 'np. Rozdział 3, trening'
                    : 'np. Spotkanie z doradcą'
              "
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <label for="timeline-location" class="block text-sm font-medium text-gray-700">
              {{
                form.type === 'planned_expense'
                  ? 'Firma / dostawca (opcjonalnie)'
                  : 'Lokalizacja (opcjonalnie)'
              }}
            </label>
            <input
              id="timeline-location"
              v-model="form.location"
              type="text"
              maxlength="255"
              :placeholder="
                form.type === 'planned_expense' ? 'np. Spotify' : 'np. Warszawa, ul. Marszałkowska 1'
              "
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div v-if="form.type === 'planned_expense'" class="grid grid-cols-2 gap-4">
            <div>
              <label for="timeline-expense-category" class="block text-sm font-medium text-gray-700">
                Kategoria
              </label>
              <input
                id="timeline-expense-category"
                v-model="form.expense_category"
                type="text"
                maxlength="64"
                placeholder="np. Music, VoD"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div class="flex items-end pb-2">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                Aktywny wydatek
              </label>
            </div>
          </div>

          <div v-if="form.type === 'planned_expense'">
            <label for="timeline-expense-interval" class="block text-sm font-medium text-gray-700">
              Interwał płatności
            </label>
            <select
              id="timeline-expense-interval"
              v-model="form.expense_interval"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option v-for="opt in PLANNED_EXPENSE_INTERVALS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="timeline-date" class="block text-sm font-medium text-gray-700">
              {{ formDateLabel }}
            </label>
            <input
              id="timeline-date"
              v-model="form.event_date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
            <p v-if="formYearlyPreview" class="mt-1.5 text-xs text-gray-500">
              W {{ formYearlyPreview.year }}:
              {{ formatEventDate(formYearlyPreview.occurrence) }}
              <span v-if="formYearlyPreview.label"> ({{ formYearlyPreview.label }})</span>
            </p>
          </div>

          <p v-if="form.type === 'planned_expense'" class="text-xs text-gray-500">
            Data kotwicy + interwał — w kalendarzu widać tylko miesiące z płatnością (29.02 → 28.02 w latach
            nieprzestępnych).
          </p>

          <label
            v-if="form.type !== 'birthday' && form.type !== 'planned_expense' && form.type !== 'goal_work'"
            class="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              v-model="form.recurrence_yearly"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Powtarza się co roku
          </label>

          <label
            v-if="form.type !== 'birthday' && form.type !== 'planned_expense' && form.type !== 'goal_work'"
            class="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              v-model="form.all_day"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Cały dzień
          </label>

          <div
            v-if="
              form.type === 'goal_work' ||
              (form.type !== 'birthday' && form.type !== 'planned_expense' && !form.all_day)
            "
            class="grid grid-cols-2 gap-4"
          >
            <div>
              <label for="timeline-start" class="block text-sm font-medium text-gray-700">Od</label>
              <input
                id="timeline-start"
                v-model="form.start_time"
                type="time"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label for="timeline-end" class="block text-sm font-medium text-gray-700">Do</label>
              <input
                id="timeline-end"
                v-model="form.end_time"
                type="time"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <div v-if="form.type === 'planned_expense'" class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label for="timeline-amount" class="block text-sm font-medium text-gray-700">Kwota</label>
              <input
                id="timeline-amount"
                v-model="form.planned_amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label for="timeline-currency" class="block text-sm font-medium text-gray-700">Waluta</label>
              <select
                id="timeline-currency"
                v-model="form.currency"
                class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <span class="block text-sm font-medium text-gray-700">Kolor w kalendarzu (opcjonalnie)</span>
            <p class="mt-0.5 text-xs text-gray-500">
              Domyślnie wg typu wpisu; własny kolor zastępuje kropkę na siatce i w listach.
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button
                v-for="hex in TIMELINE_EVENT_COLOR_PRESETS"
                :key="hex"
                type="button"
                :title="hex"
                class="size-7 rounded-full ring-2 ring-offset-1 ring-offset-white transition-shadow focus:outline-none focus-visible:ring-indigo-600"
                :class="form.color === hex ? 'ring-indigo-600' : 'ring-transparent hover:ring-gray-300'"
                :style="{ backgroundColor: hex }"
                @click="form.color = hex"
              />
              <label
                class="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                <span class="sr-only">Własny kolor</span>
                <input
                  type="color"
                  class="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                  :value="form.color || '#6366f1'"
                  @input="form.color = $event.target.value"
                />
                Własny
              </label>
              <button
                type="button"
                class="text-xs font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
                @click="form.color = ''"
              >
                Domyślny (typ)
              </button>
            </div>
          </div>

          <div>
            <label for="timeline-link" class="block text-sm font-medium text-gray-700">Link (opcjonalnie)</label>
            <input
              id="timeline-link"
              v-model="form.link"
              type="text"
              inputmode="url"
              maxlength="2048"
              placeholder="https://…"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <label for="timeline-notes" class="block text-sm font-medium text-gray-700">Notatki (opcjonalnie)</label>
            <textarea
              id="timeline-notes"
              v-model="form.notes"
              rows="3"
              placeholder="Dodatkowe informacje…"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              v-if="editingId"
              type="button"
              class="rounded-md px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              :disabled="saving"
              @click="$emit('delete')"
            >
              Usuń
            </button>
            <span v-else />
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                @click="$emit('close')"
              >
                Anuluj
              </button>
              <button
                type="submit"
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                :disabled="saving"
              >
                {{ saving ? 'Zapisywanie…' : editingId ? 'Zapisz' : 'Dodaj' }}
              </button>
            </div>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { TIMELINE_EVENT_TYPES_FORM } from '../../constants/timelineEventTypes'
import { PLANNED_EXPENSE_INTERVALS } from '../../constants/plannedExpenseIntervals'
import { TIMELINE_EVENT_COLOR_PRESETS } from '../../utils/timelineEventColor'
import { formatEventDate } from '../../utils/calendarGrid'

import { formatWorkDuration } from '../../utils/growthGoalWork'

const props = defineProps({
  open: { type: Boolean, required: true },
  editingId: { type: [Number, String], default: null },
  saving: { type: Boolean, default: false },
  formError: { type: String, default: '' },
  /** Reactive object from parent */
  form: { type: Object, required: true },
  formDateLabel: { type: String, required: true },
  formYearlyPreview: { type: Object, default: null },
  activeGoals: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'submit', 'delete', 'goal-change'])

function onGoalChange() {
  emit('goal-change', props.form.growth_goal_id)
}
</script>
