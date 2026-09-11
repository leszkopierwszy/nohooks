<template>
  <div>
    <form
      ref="formRef"
      class="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-900/5"
      @submit.prevent="submit"
    >
      <!-- Nagłówek -->
      <header :class="growthFormHeader">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold tracking-tight text-gray-900">{{ formTitle }}</h2>
            <p class="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
              {{ t('growth.wellbeing.formIntro') }}
            </p>
          </div>
          <span
            v-if="editingId"
            :class="growthEditBadge"
          >
            {{ t('growth.wellbeing.editing') }}
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

        <!-- Data -->
        <section :class="[growthFormSection, 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between']">
          <div class="min-w-0 flex-1 sm:max-w-[14rem]">
            <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500" for="wb-date">
              {{ t('growth.wellbeing.date') }}
            </label>
            <input
              id="wb-date"
              v-model="form.logged_at"
              type="date"
              required
              :class="growthInputClass"
            />
          </div>
          <p
            v-if="selectedMoodPreview"
            class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200/80"
          >
            <span class="text-xl leading-none" aria-hidden="true">{{ selectedMoodPreview.emoji }}</span>
            <span class="font-medium">{{ selectedMoodPreview.label }}</span>
          </p>
        </section>

        <!-- Nastrój -->
        <section :class="[growthFormPanel, 'sm:p-5']">
          <GrowthMoodPicker
            v-model="form.mood"
            :label="t('growth.wellbeing.mood')"
            :hint="t('growth.wellbeing.moodHint')"
          />
        </section>

        <!-- Emocje + ciało -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {{ t('growth.wellbeing.detailsSection') }}
          </h3>
          <div class="mt-3 grid gap-4 lg:grid-cols-2">
            <section :class="growthFormPanel">
              <GrowthChipMultiSelect
                v-model="form.emotions"
                :label="t('growth.wellbeing.emotionsLabel')"
                :hint="t('growth.wellbeing.emotionsHint')"
                :options="GROWTH_EMOTIONS"
                allow-custom
                v-model:custom-value="form.custom_emotion"
                :custom-placeholder="t('growth.wellbeing.customEmotion')"
              />
            </section>
            <section :class="growthFormPanel">
              <GrowthChipMultiSelect
                v-model="form.body"
                :label="t('growth.wellbeing.bodyLabel')"
                :hint="t('growth.wellbeing.bodyHint')"
                :options="GROWTH_BODY_AREAS"
                allow-custom
                v-model:custom-value="form.custom_body"
                :custom-placeholder="t('growth.wellbeing.customBody')"
              />
            </section>
          </div>
        </div>

        <!-- Notatka -->
        <section :class="growthFormSection">
          <label class="block text-sm font-semibold text-gray-900" for="wb-note">
            {{ t('growth.wellbeing.note') }}
            <span class="font-normal text-gray-500">({{ t('growth.form.optional') }})</span>
          </label>
          <textarea
            id="wb-note"
            v-model="form.note"
            rows="3"
            maxlength="2000"
            :placeholder="t('growth.wellbeing.notePlaceholder')"
            :class="growthTextareaClass"
          />
        </section>
      </div>

      <!-- Stopka -->
      <footer class="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200/80 bg-stone-50/40 px-5 py-4 sm:px-6">
        <button
          v-if="editingId"
          type="button"
          :class="growthSecondaryBtn"
          @click="resetForm"
        >
          {{ t('growth.wellbeing.cancelEdit') }}
        </button>
        <button
          type="submit"
          :class="growthPrimaryBtn"
          :disabled="!canSubmit"
        >
          {{ editingId ? t('growth.wellbeing.save') : t('growth.wellbeing.add') }}
        </button>
      </footer>
    </form>

    <section class="mt-10">
      <h2 class="text-base font-semibold text-gray-900">{{ t('growth.wellbeing.history') }}</h2>
      <ul v-if="entries.length" class="mt-4 space-y-3">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm transition hover:border-gray-300/90"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span
                v-if="entry.mood != null"
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-lg ring-1 ring-inset ring-gray-200"
                :title="moodLabel(entry.mood)"
              >
                {{ growthMoodMeta(entry.mood)?.emoji }}
              </span>
              <time class="text-sm font-medium text-gray-900">{{ formatDate(entry.logged_at) }}</time>
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
          <div v-if="emotionLabels(entry).length || bodyLabels(entry).length" class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="label in emotionLabels(entry)"
              :key="'e-' + label"
              :class="growthHistoryTag"
            >
              {{ label }}
            </span>
            <span
              v-for="label in bodyLabels(entry)"
              :key="'b-' + label"
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
        {{ t('growth.wellbeing.empty') }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import GrowthChipMultiSelect from '../../components/growth/GrowthChipMultiSelect.vue'
import GrowthMoodPicker from '../../components/growth/GrowthMoodPicker.vue'
import {
  GROWTH_BODY_AREAS,
  GROWTH_EMOTIONS,
} from '../../constants/growthTrackers'
import { growthMoodMeta, GROWTH_MOOD_LEVELS } from '../../constants/growthGoals'
import { useI18n } from '../../composables/useI18n'
import { useGrowthWellbeingStore } from '../../stores/growthWellbeing'
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
const store = useGrowthWellbeingStore()

const formRef = ref(null)
const editingId = ref(null)
const formError = ref('')

const emptyForm = () => ({
  logged_at: new Date().toISOString().slice(0, 10),
  mood: null,
  emotions: [],
  body: [],
  custom_emotion: '',
  custom_body: '',
  note: '',
})

const form = reactive(emptyForm())

onMounted(() => store.reload())

const entries = computed(() => store.sortedEntries)

const formTitle = computed(() =>
  editingId.value ? t('growth.wellbeing.editTitle') : t('growth.wellbeing.formTitle'),
)

const selectedMoodPreview = computed(() => {
  if (form.mood == null) return null
  const meta = GROWTH_MOOD_LEVELS.find((m) => m.value === form.mood)
  if (!meta) return null
  return { emoji: meta.emoji, label: t(meta.labelKey) }
})

const canSubmit = computed(() => hasWellbeingContent(form))

function hasWellbeingContent(data) {
  return (
    data.mood != null ||
    data.emotions.length > 0 ||
    data.body.length > 0 ||
    String(data.custom_emotion).trim() !== '' ||
    String(data.custom_body).trim() !== '' ||
    String(data.note).trim() !== ''
  )
}

function emotionLabels(entry) {
  const fromPresets = entry.emotions.map((v) => {
    const opt = GROWTH_EMOTIONS.find((e) => e.value === v)
    return opt ? t(opt.labelKey) : v
  })
  if (entry.custom_emotion) fromPresets.push(entry.custom_emotion)
  return fromPresets
}

function bodyLabels(entry) {
  const fromPresets = entry.body.map((v) => {
    const opt = GROWTH_BODY_AREAS.find((b) => b.value === v)
    return opt ? t(opt.labelKey) : v
  })
  if (entry.custom_body) fromPresets.push(entry.custom_body)
  return fromPresets
}

function moodLabel(mood) {
  const meta = growthMoodMeta(mood)
  return meta ? `${meta.emoji} ${t(meta.labelKey)}` : ''
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
  form.mood = entry.mood
  form.emotions = [...entry.emotions]
  form.body = [...entry.body]
  form.custom_emotion = entry.custom_emotion
  form.custom_body = entry.custom_body
  form.note = entry.note
  nextTick(() => {
    formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function submit() {
  formError.value = ''
  if (!canSubmit.value) {
    formError.value = t('growth.wellbeing.validation')
    return
  }
  const payload = {
    logged_at: form.logged_at,
    mood: form.mood,
    emotions: [...form.emotions],
    body: [...form.body],
    custom_emotion: form.custom_emotion.trim(),
    custom_body: form.custom_body.trim(),
    note: form.note.trim(),
  }
  if (editingId.value) store.updateEntry(editingId.value, payload)
  else store.addEntry(payload)
  resetForm()
}

function confirmDelete(entry) {
  if (!window.confirm(t('growth.wellbeing.deleteConfirm'))) return
  store.deleteEntry(entry.id)
  if (editingId.value === entry.id) resetForm()
}
</script>
