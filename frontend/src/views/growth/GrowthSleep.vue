<template>
  <div>
    <form
      ref="formRef"
      class="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-900/5"
      @submit.prevent="submit"
    >
      <header
        :class="growthFormHeader"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold tracking-tight text-gray-900">{{ formTitle }}</h2>
            <p class="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
              {{ t('growth.sleep.formIntro') }}
            </p>
          </div>
          <span
            v-if="editingId"
            :class="growthEditBadge"
          >
            {{ t('growth.sleep.editing') }}
          </span>
        </div>
      </header>

      <div class="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <p
          v-if="formError"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
          role="alert"
        >
          {{ formError }}
        </p>

        <section :class="growthFormSection">
          <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500" for="sl-date">
            {{ t('growth.sleep.date') }}
          </label>
          <input
            id="sl-date"
            v-model="form.logged_at"
            type="date"
            required
            :class="[growthInputClass, 'max-w-xs']"
          />
          <p class="mt-2 text-xs leading-relaxed text-gray-500">{{ t('growth.sleep.dateHint') }}</p>
        </section>

        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {{ t('growth.sleep.timesSection') }}
          </h3>
          <section :class="[growthFormPanel, 'mt-3 grid gap-4 sm:grid-cols-2']">
            <div>
              <label class="block text-sm font-semibold text-gray-900" for="sl-bed">
                {{ t('growth.sleep.bedTime') }}
              </label>
              <input
                id="sl-bed"
                v-model="form.bed_time"
                type="time"
                :class="growthInputClass"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900" for="sl-wake">
                {{ t('growth.sleep.wakeTime') }}
              </label>
              <input
                id="sl-wake"
                v-model="form.wake_time"
                type="time"
                :class="growthInputClass"
              />
            </div>
            <p
              v-if="durationPreview"
              class="sm:col-span-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold tabular-nums text-stone-800 shadow-sm ring-1 ring-inset ring-stone-200"
            >
              <span class="text-base" aria-hidden="true">🌙</span>
              {{ t('growth.sleep.duration') }}: {{ durationPreview }}
            </p>
          </section>
        </div>

        <section :class="[growthFormPanel, 'sm:p-5']">
          <GrowthMoodPicker
            v-model="form.quality"
            :label="t('growth.sleep.qualityLabel')"
            :hint="t('growth.sleep.qualityHint')"
            :levels="GROWTH_SLEEP_QUALITY_LEVELS"
            required
          />
        </section>

        <section :class="growthFormPanel">
          <GrowthChipMultiSelect
            v-model="form.factors"
            :label="t('growth.sleep.factorsLabel')"
            :hint="t('growth.sleep.factorsHint')"
            :options="GROWTH_SLEEP_FACTORS"
            allow-custom
            v-model:custom-value="form.custom_factor"
            :custom-placeholder="t('growth.sleep.customFactor')"
          />
        </section>

        <section :class="growthFormSection">
          <label class="block text-sm font-semibold text-gray-900" for="sl-note">
            {{ t('growth.sleep.note') }}
            <span class="font-normal text-gray-500">({{ t('growth.form.optional') }})</span>
          </label>
          <textarea
            id="sl-note"
            v-model="form.note"
            rows="3"
            maxlength="2000"
            :placeholder="t('growth.sleep.notePlaceholder')"
            :class="growthTextareaClass"
          />
        </section>
      </div>

      <footer class="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200/80 bg-stone-50/40 px-5 py-4 sm:px-6">
        <button
          v-if="editingId"
          type="button"
          :class="growthSecondaryBtn"
          @click="resetForm"
        >
          {{ t('growth.sleep.cancelEdit') }}
        </button>
        <button
          type="submit"
          :class="growthPrimaryBtn"
          :disabled="!canSubmit"
        >
          {{ editingId ? t('growth.sleep.save') : t('growth.sleep.add') }}
        </button>
      </footer>
    </form>

    <section class="mt-10">
      <h2 class="text-base font-semibold text-gray-900">{{ t('growth.sleep.history') }}</h2>
      <ul v-if="entries.length" class="mt-4 space-y-3">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm transition hover:border-gray-300/90"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex items-start gap-2.5">
              <span
                v-if="entry.quality != null"
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg ring-1 ring-inset ring-slate-200"
              >
                {{ sleepQualityMeta(entry.quality)?.emoji }}
              </span>
              <div>
                <time class="text-sm font-medium text-gray-900">{{ formatDate(entry.logged_at) }}</time>
                <p v-if="entry.quality != null" class="mt-0.5 text-xs text-gray-600">
                  {{ qualityLabel(entry.quality) }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-md px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                @click="startEdit(entry)"
              >
                {{ t('growth.card.edit') }}
              </button>
              <button
                type="button"
                class="rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100"
                @click="confirmDelete(entry)"
              >
                {{ t('growth.card.delete') }}
              </button>
            </div>
          </div>
          <p v-if="timeRangeLine(entry)" class="mt-2 text-sm text-gray-600">
            {{ timeRangeLine(entry) }}
            <span v-if="entry.duration_minutes != null" class="font-medium text-slate-800">
              · {{ formatSleepDuration(entry.duration_minutes) }}
            </span>
          </p>
          <div v-if="factorLabels(entry).length" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="label in factorLabels(entry)"
              :key="label"
              :class="growthHistoryTag"
            >
              {{ label }}
            </span>
          </div>
          <p v-if="entry.note" class="mt-2 text-sm leading-relaxed text-gray-600">{{ entry.note }}</p>
        </li>
      </ul>
      <p
        v-else
        class="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center text-sm text-gray-500"
      >
        {{ t('growth.sleep.empty') }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import GrowthChipMultiSelect from '../../components/growth/GrowthChipMultiSelect.vue'
import GrowthMoodPicker from '../../components/growth/GrowthMoodPicker.vue'
import {
  GROWTH_SLEEP_FACTORS,
  GROWTH_SLEEP_QUALITY_LEVELS,
  sleepQualityMeta,
} from '../../constants/growthTrackers'
import { useI18n } from '../../composables/useI18n'
import { useGrowthSleepStore } from '../../stores/growthSleep'
import { computeSleepDurationMinutes, formatSleepDuration } from '../../utils/growthSleep'
import {
  growthEditBadge,
  growthFormHeader,
  growthFormPanel,
  growthFormSection,
  growthHistoryTag,
  growthInputClass,
  growthPrimaryBtn,
  growthSecondaryBtn,
  growthTextareaClass,
} from '../../constants/growthUi'

const { t } = useI18n()
const store = useGrowthSleepStore()

const formRef = ref(null)
const editingId = ref(null)
const formError = ref('')

const emptyForm = () => ({
  logged_at: new Date().toISOString().slice(0, 10),
  bed_time: '23:00',
  wake_time: '07:00',
  quality: null,
  factors: [],
  custom_factor: '',
  note: '',
})

const form = reactive(emptyForm())

onMounted(() => store.reload())

const entries = computed(() => store.sortedEntries)

const formTitle = computed(() =>
  editingId.value ? t('growth.sleep.editTitle') : t('growth.sleep.formTitle'),
)

const durationPreview = computed(() => {
  const mins = computeSleepDurationMinutes(form.bed_time, form.wake_time)
  return mins != null ? formatSleepDuration(mins) : ''
})

const canSubmit = computed(() => form.quality != null)

function factorLabels(entry) {
  const fromPresets = entry.factors.map((v) => {
    const opt = GROWTH_SLEEP_FACTORS.find((f) => f.value === v)
    return opt ? t(opt.labelKey) : v
  })
  if (entry.custom_factor) fromPresets.push(entry.custom_factor)
  return fromPresets
}

function qualityLabel(quality) {
  const meta = sleepQualityMeta(quality)
  return meta ? `${meta.emoji} ${t(meta.labelKey)}` : ''
}

function timeRangeLine(entry) {
  if (!entry.bed_time && !entry.wake_time) return ''
  if (entry.bed_time && entry.wake_time) {
    return t('growth.sleep.timeRange', { bed: entry.bed_time, wake: entry.wake_time })
  }
  return entry.bed_time || entry.wake_time
}

function formatDate(dateKey) {
  try {
    return new Date(dateKey + 'T12:00:00').toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function resetForm() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, emptyForm())
}

function startEdit(entry) {
  editingId.value = entry.id
  formError.value = ''
  form.logged_at = entry.logged_at
  form.bed_time = entry.bed_time || ''
  form.wake_time = entry.wake_time || ''
  form.quality = entry.quality
  form.factors = [...entry.factors]
  form.custom_factor = entry.custom_factor
  form.note = entry.note
  nextTick(() => {
    formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function submit() {
  formError.value = ''
  if (!canSubmit.value) {
    formError.value = t('growth.sleep.validation')
    return
  }
  const payload = {
    logged_at: form.logged_at,
    bed_time: form.bed_time,
    wake_time: form.wake_time,
    quality: form.quality,
    factors: [...form.factors],
    custom_factor: form.custom_factor.trim(),
    note: form.note.trim(),
  }
  if (editingId.value) store.updateEntry(editingId.value, payload)
  else store.addEntry(payload)
  resetForm()
}

function confirmDelete(entry) {
  if (!window.confirm(t('growth.sleep.deleteConfirm'))) return
  store.deleteEntry(entry.id)
  if (editingId.value === entry.id) resetForm()
}
</script>
