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
              class="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-stone-200"
            >
              <header :class="growthFormHeader">
                <DialogTitle class="text-base font-semibold text-gray-900">
                  {{ isNew ? t('growth.form.createTitle') : t('growth.form.editTitle') }}
                </DialogTitle>
              </header>

              <form
                id="growth-goal-form"
                class="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
                @submit.prevent="submit"
              >
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500" for="growth-type">
                    {{ t('growth.form.type') }}
                  </label>
                  <select id="growth-type" v-model="form.type" :class="[growthInputClass, 'max-w-none']">
                    <option v-for="opt in GROWTH_GOAL_TYPES" :key="opt.value" :value="opt.value">
                      {{ t(opt.labelKey) }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-900" for="growth-title">
                    {{ t('growth.form.title') }}
                  </label>
                  <input
                    id="growth-title"
                    v-model="form.title"
                    type="text"
                    required
                    maxlength="200"
                    :class="growthInputClass"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-900" for="growth-event-date">
                    {{ t('growth.form.eventDate') }}
                    <span class="font-normal text-gray-500">({{ t('growth.form.optional') }})</span>
                  </label>
                  <input
                    id="growth-event-date"
                    v-model="form.event_date"
                    type="date"
                    :class="[growthInputClass, 'max-w-xs']"
                  />
                  <p class="mt-1 text-xs text-gray-500">{{ t('growth.form.eventDateHint') }}</p>
                </div>

                <section :class="growthFormSection">
                  <GrowthMoodPicker
                    v-model="form.load_level"
                    :label="t('growth.form.loadLevel')"
                    :hint="t('growth.form.loadLevelHint')"
                    :levels="GROWTH_LOAD_LEVELS"
                  />
                </section>

                <div>
                  <label class="block text-sm font-semibold text-gray-900" for="growth-desc">
                    {{ t('growth.form.description') }}
                  </label>
                  <textarea
                    id="growth-desc"
                    v-model="form.description"
                    rows="3"
                    maxlength="2000"
                    :class="growthTextareaClass"
                  />
                </div>

                <section :class="growthFormPanel">
                  <label class="flex cursor-pointer items-start gap-3">
                    <input
                      v-model="form.reminders_enabled"
                      type="checkbox"
                      class="mt-0.5 size-4 rounded border-stone-300 text-gray-900 focus:ring-gray-400"
                      :disabled="!form.event_date"
                    />
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-gray-900">
                        {{ t('growth.form.remindersEnabled') }}
                      </span>
                      <span class="mt-0.5 block text-xs text-gray-500">
                        {{ form.event_date ? t('growth.form.remindersHint') : t('growth.form.remindersNeedDate') }}
                      </span>
                    </span>
                  </label>

                  <template v-if="form.reminders_enabled && form.event_date">
                    <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {{ t('growth.form.reminderWhen') }}
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <label
                        v-for="day in GROWTH_REMINDER_DAY_OPTIONS"
                        :key="day"
                        class="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition"
                        :class="
                          form.reminder_days_before.includes(day)
                            ? growthChipActive
                            : growthChipIdle
                        "
                      >
                        <input
                          v-model="form.reminder_days_before"
                          type="checkbox"
                          :value="day"
                          class="sr-only"
                        />
                        {{ reminderDayLabel(day) }}
                      </label>
                    </div>
                    <div class="mt-4">
                      <label class="block text-xs font-medium text-gray-700" for="growth-reminder-time">
                        {{ t('growth.form.reminderTime') }}
                      </label>
                      <input
                        id="growth-reminder-time"
                        v-model="form.reminder_time"
                        type="time"
                        :class="[growthInputClass, 'max-w-[8rem]']"
                      />
                    </div>
                  </template>
                </section>
              </form>

              <footer class="flex shrink-0 justify-end gap-2 border-t border-stone-200/80 bg-stone-50/40 px-5 py-4 sm:px-6">
                <button type="button" :class="growthSecondaryBtn" @click="$emit('close')">
                  {{ t('growth.form.cancel') }}
                </button>
                <button
                  type="submit"
                  form="growth-goal-form"
                  :class="growthPrimaryBtn"
                  :disabled="saving"
                >
                  {{ saving ? t('growth.form.saving') : t('growth.form.save') }}
                </button>
              </footer>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { reactive, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import GrowthMoodPicker from './GrowthMoodPicker.vue'
import {
  GROWTH_GOAL_TYPES,
  GROWTH_LOAD_LEVELS,
  GROWTH_REMINDER_DAY_OPTIONS,
} from '../../constants/growthGoals'
import {
  growthChipActive,
  growthChipIdle,
  growthFormHeader,
  growthFormPanel,
  growthFormSection,
  growthInputClass,
  growthPrimaryBtn,
  growthSecondaryBtn,
  growthTextareaClass,
} from '../../constants/growthUi'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  open: { type: Boolean, default: false },
  goal: { type: Object, default: null },
  isNew: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const form = reactive({
  type: 'achievement',
  title: '',
  description: '',
  event_date: '',
  load_level: null,
  reminders_enabled: false,
  reminder_days_before: [7, 1, 0],
  reminder_time: '09:00',
})

watch(
  () => form.event_date,
  (date) => {
    if (!date) form.reminders_enabled = false
  },
)

watch(
  () => [props.open, props.goal, props.isNew],
  () => {
    if (!props.open) return
    if (props.isNew) {
      form.type = 'achievement'
      form.title = ''
      form.description = ''
      form.event_date = ''
      form.load_level = null
      form.reminders_enabled = false
      form.reminder_days_before = [7, 1, 0]
      form.reminder_time = '09:00'
      return
    }
    const g = props.goal
    form.type = g?.type ?? 'achievement'
    form.title = g?.title ?? ''
    form.description = g?.description ?? ''
    form.event_date = g?.event_date ?? ''
    form.load_level = g?.load_level ?? null
    form.reminders_enabled = Boolean(g?.reminders_enabled)
    form.reminder_days_before = [...(g?.reminder_days_before ?? [7, 1, 0])]
    form.reminder_time = g?.reminder_time ?? '09:00'
  },
  { immediate: true },
)

function reminderDayLabel(day) {
  if (day === 0) return t('growth.form.reminderDay0')
  return t('growth.form.reminderDayN', { days: day })
}

function submit() {
  emit('save', {
    type: form.type,
    title: form.title.trim(),
    description: form.description.trim(),
    event_date: form.event_date || null,
    load_level: form.load_level,
    reminders_enabled: form.reminders_enabled && Boolean(form.event_date),
    reminder_days_before: [...form.reminder_days_before],
    reminder_time: form.reminder_time,
  })
}
</script>
