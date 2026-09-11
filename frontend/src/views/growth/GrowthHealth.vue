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
              {{ t('growth.health.formIntro') }}
            </p>
          </div>
          <span
            v-if="editingId"
            :class="growthEditBadge"
          >
            {{ t('growth.health.editing') }}
          </span>
        </div>
      </header>

      <div class="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <section>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {{ t('growth.health.quickTitle') }}
          </h3>
          <p class="mt-1 text-xs text-gray-500">{{ t('growth.health.quickHint') }}</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              v-for="status in GROWTH_HEALTH_STATUSES"
              :key="status.value"
              type="button"
              :class="[
                'rounded-xl border-2 px-3 py-3.5 text-left transition-all duration-150',
                form.status === status.value
                  ? statusActiveClass()
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/80',
              ]"
              @click="selectStatus(status.value)"
            >
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="status.class"
              >
                {{ t(status.labelKey) }}
              </span>
            </button>
          </div>
        </section>

        <section :class="growthFormSection">
          <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500" for="hl-date">
            {{ t('growth.health.date') }}
          </label>
          <input
            id="hl-date"
            v-model="form.logged_at"
            type="date"
            required
            :class="[growthInputClass, 'max-w-xs']"
          />
        </section>

        <section
          v-if="form.status === 'sick'"
          :class="growthFormPanel"
        >
          <label class="block text-sm font-semibold text-gray-900" for="hl-sick">
            {{ t('growth.health.sickDetail') }}
          </label>
          <input
            id="hl-sick"
            v-model="form.detail"
            type="text"
            :placeholder="t('growth.health.sickPlaceholder')"
            :class="growthInputClass"
          />
        </section>

        <section
          v-if="form.status === 'injury'"
          :class="growthFormPanel"
        >
          <label class="block text-sm font-semibold text-gray-900" for="hl-injury">
            {{ t('growth.health.injuryDetail') }}
          </label>
          <input
            id="hl-injury"
            v-model="form.detail"
            type="text"
            :placeholder="t('growth.health.injuryPlaceholder')"
            :class="growthInputClass"
          />
        </section>

        <section :class="growthFormSection">
          <label class="block text-sm font-semibold text-gray-900" for="hl-note">
            {{ t('growth.health.note') }}
            <span class="font-normal text-gray-500">({{ t('growth.form.optional') }})</span>
          </label>
          <textarea
            id="hl-note"
            v-model="form.note"
            rows="3"
            maxlength="2000"
            :placeholder="t('growth.health.notePlaceholder')"
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
          {{ t('growth.health.cancelEdit') }}
        </button>
        <button
          type="submit"
          :class="growthPrimaryBtn"
        >
          {{ editingId ? t('growth.health.save') : t('growth.health.add') }}
        </button>
      </footer>
    </form>

    <section class="mt-10">
      <h2 class="text-base font-semibold text-gray-900">{{ t('growth.health.history') }}</h2>
      <ul v-if="entries.length" class="mt-4 space-y-3">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm transition hover:border-gray-300/90"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <time class="text-sm font-medium text-gray-900">{{ formatDate(entry.logged_at) }}</time>
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="healthStatusMeta(entry.status).class"
              >
                {{ t(healthStatusMeta(entry.status).labelKey) }}
              </span>
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
          <p v-if="entry.detail" class="mt-2 text-sm font-medium text-gray-800">{{ entry.detail }}</p>
          <p v-if="entry.note" class="mt-1 text-sm leading-relaxed text-gray-600">{{ entry.note }}</p>
        </li>
      </ul>
      <p
        v-else
        class="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center text-sm text-gray-500"
      >
        {{ t('growth.health.empty') }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { GROWTH_HEALTH_STATUSES, healthStatusMeta } from '../../constants/growthTrackers'
import { useI18n } from '../../composables/useI18n'
import { useGrowthHealthStore } from '../../stores/growthHealth'
import {
  growthEditBadge,
  growthFormHeader,
  growthFormPanel,
  growthFormSection,
  growthInputClass,
  growthPrimaryBtn,
  growthSecondaryBtn,
  growthTextareaClass,
} from '../../constants/growthUi'

const { t } = useI18n()
const store = useGrowthHealthStore()

const formRef = ref(null)
const editingId = ref(null)

const emptyForm = () => ({
  logged_at: new Date().toISOString().slice(0, 10),
  status: 'healthy',
  detail: '',
  note: '',
})

const form = reactive(emptyForm())

onMounted(() => store.reload())

const entries = computed(() => store.sortedEntries)

const formTitle = computed(() =>
  editingId.value ? t('growth.health.editTitle') : t('growth.health.formTitle'),
)

const STATUS_ACTIVE =
  'border-stone-400 bg-stone-100 ring-1 ring-stone-900/10 shadow-sm'

function statusActiveClass() {
  return STATUS_ACTIVE
}

function selectStatus(value) {
  if (form.status !== value) form.detail = ''
  form.status = value
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
  Object.assign(form, emptyForm())
}

function startEdit(entry) {
  editingId.value = entry.id
  form.logged_at = entry.logged_at
  form.status = entry.status
  form.detail = entry.detail
  form.note = entry.note
  nextTick(() => {
    formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function submit() {
  const payload = {
    logged_at: form.logged_at,
    status: form.status,
    detail: form.detail.trim(),
    note: form.note.trim(),
  }
  if (editingId.value) store.updateEntry(editingId.value, payload)
  else store.addEntry(payload)
  resetForm()
}

function confirmDelete(entry) {
  if (!window.confirm(t('growth.health.deleteConfirm'))) return
  store.deleteEntry(entry.id)
  if (editingId.value === entry.id) resetForm()
}
</script>
