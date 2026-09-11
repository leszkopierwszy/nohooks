<template>
  <div class="space-y-10">
    <section v-if="latestSnapshot">
      <h4 class="text-sm font-medium text-gray-900">Aktualnie (ostatni wpis)</h4>
      <p class="mt-1 text-xs text-gray-500">
        {{ formatSnapshotDate(latestSnapshot.recorded_at) }}
      </p>
      <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div v-if="latestSnapshot.height_cm != null">
          <dt class="text-xs text-gray-500">Wzrost</dt>
          <dd class="mt-0.5 text-sm font-medium text-gray-900">
            {{ formatMeasurement(latestSnapshot.height_cm, 'cm') }}
            <span v-if="heightDelta" class="ml-1 text-xs font-normal text-indigo-600">
              {{ heightDelta }}
            </span>
          </dd>
        </div>
        <div v-if="latestSnapshot.weight_kg != null">
          <dt class="text-xs text-gray-500">Waga</dt>
          <dd class="mt-0.5 text-sm font-medium text-gray-900">
            {{ formatMeasurement(latestSnapshot.weight_kg, 'kg') }}
            <span v-if="weightDelta" class="ml-1 text-xs font-normal text-indigo-600">
              {{ weightDelta }}
            </span>
          </dd>
        </div>
        <div v-if="latestSnapshot.skin_tone">
          <dt class="text-xs text-gray-500">Kolor skóry</dt>
          <dd class="mt-1 flex items-center gap-2 text-sm text-gray-900">
            <span
              class="size-5 shrink-0 rounded-full border border-gray-200"
              :style="skinToneSwatchStyle(latestSnapshot.skin_tone)"
            />
            {{ displaySkinTone(latestSnapshot.skin_tone) }}
          </dd>
        </div>
        <div v-for="field in bodyMeasureFields" :key="field.key">
          <template v-if="latestSnapshot[field.key] != null">
            <dt class="text-xs text-gray-500">{{ field.label }}</dt>
            <dd class="mt-0.5 text-sm font-medium text-gray-900">
              {{ formatMeasurement(latestSnapshot[field.key], 'cm') }}
            </dd>
          </template>
        </div>
      </dl>
    </section>

    <section class="rounded-lg border border-gray-200 bg-gray-50/80 p-6">
      <h4 class="text-sm font-medium text-gray-900">
        {{ editingId ? 'Edytuj wpis' : 'Nowy wpis pomiarowy' }}
      </h4>
      <p class="mt-1 text-xs text-gray-500">
        Każdy zapis to snapshot w czasie — historia poniżej.
      </p>

      <p v-if="formError" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ formError }}
      </p>

      <form class="mt-6 space-y-6" @submit.prevent="saveSnapshot">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label :for="`${idPrefix}-recorded-at`" class="block text-sm font-medium text-gray-700">
              Data pomiaru
            </label>
            <input
              :id="`${idPrefix}-recorded-at`"
              v-model="form.recorded_at"
              type="date"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label :for="`${idPrefix}-height`" class="block text-sm font-medium text-gray-700">
              Wzrost (cm)
            </label>
            <input
              :id="`${idPrefix}-height`"
              v-model="form.height_cm"
              type="number"
              step="0.1"
              min="0"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label :for="`${idPrefix}-weight`" class="block text-sm font-medium text-gray-700">
              Waga (kg)
            </label>
            <input
              :id="`${idPrefix}-weight`"
              v-model="form.weight_kg"
              type="number"
              step="0.1"
              min="0"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label :for="`${idPrefix}-skin`" class="block text-sm font-medium text-gray-700">
              Kolor skóry
            </label>
            <select
              :id="`${idPrefix}-skin`"
              v-model="form.skin_tone"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">—</option>
              <option v-for="opt in SKIN_TONE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700">Parametry ciała (cm)</p>
          <div class="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div v-for="field in bodyMeasureFields" :key="field.key">
              <label :for="`${idPrefix}-${field.key}`" class="block text-xs text-gray-600">
                {{ field.label }}
              </label>
              <input
                :id="`${idPrefix}-${field.key}`"
                v-model="form[field.key]"
                type="number"
                step="0.1"
                min="0"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label :for="`${idPrefix}-notes`" class="block text-sm font-medium text-gray-700">
            Notatki
          </label>
          <textarea
            :id="`${idPrefix}-notes`"
            v-model="form.notes"
            rows="2"
            placeholder="np. po treningu, rano na czczo…"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {{ saving ? 'Zapisywanie…' : editingId ? 'Zapisz zmiany' : 'Dodaj wpis' }}
          </button>
          <button
            v-if="editingId"
            type="button"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            @click="cancelEdit"
          >
            Anuluj edycję
          </button>
        </div>
      </form>
    </section>

    <section>
      <h4 class="text-sm font-medium text-gray-900">Historia pomiarów</h4>
      <p v-if="loading" class="mt-4 text-sm text-gray-500">Ładowanie…</p>
      <p v-else-if="!snapshots.length" class="mt-4 text-sm text-gray-500">
        Brak zapisanych pomiarów. Dodaj pierwszy wpis powyżej.
      </p>
      <div v-else class="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Data</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Wzrost</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Waga</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Skóra</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Ciało</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700">Akcje</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr
              v-for="row in snapshots"
              :key="row.id"
              :class="editingId === row.id ? 'bg-indigo-50/50' : ''"
            >
              <td class="whitespace-nowrap px-4 py-3 text-gray-900">
                {{ formatSnapshotDate(row.recorded_at) }}
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ formatMeasurement(row.height_cm, 'cm') }}
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ formatMeasurement(row.weight_kg, 'kg') }}
              </td>
              <td class="px-4 py-3 text-gray-700">
                <span v-if="row.skin_tone" class="inline-flex items-center gap-1.5">
                  <span
                    class="size-4 rounded-full border border-gray-200"
                    :style="skinToneSwatchStyle(row.skin_tone)"
                  />
                  {{ displaySkinTone(row.skin_tone) }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ bodyMeasuresSummary(row) }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <button
                  type="button"
                  class="font-medium text-indigo-600 hover:text-indigo-500"
                  @click="startEdit(row)"
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  class="ml-3 font-medium text-red-600 hover:text-red-500"
                  @click="removeSnapshot(row)"
                >
                  Usuń
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { apiRequest } from '../api/client'
import {
  SKIN_TONE_OPTIONS,
  deltaLabel,
  displaySkinTone,
  emptyBodyForm,
  formatMeasurement,
  formatSnapshotDate,
  formToPayload,
  skinToneSwatchStyle,
  snapshotToForm,
} from '../constants/personaBodyMetrics'

const props = defineProps({
  entityId: {
    type: [String, Number],
    required: true,
  },
  idPrefix: {
    type: String,
    default: 'persona-body',
  },
})

const emit = defineEmits(['updated'])

const bodyMeasureFields = [
  { key: 'chest_cm', label: 'Klatka' },
  { key: 'waist_cm', label: 'Talia' },
  { key: 'hips_cm', label: 'Biodra' },
  { key: 'shoulder_cm', label: 'Barki' },
  { key: 'inseam_cm', label: 'Wewn. nogawka' },
]

const snapshots = ref([])
const loading = ref(false)
const saving = ref(false)
const formError = ref(null)
const editingId = ref(null)
const form = reactive(emptyBodyForm())

const latestSnapshot = computed(() => snapshots.value[0] ?? null)
const previousSnapshot = computed(() => snapshots.value[1] ?? null)

const heightDelta = computed(() =>
  deltaLabel(latestSnapshot.value?.height_cm, previousSnapshot.value?.height_cm, 'cm')
)
const weightDelta = computed(() =>
  deltaLabel(latestSnapshot.value?.weight_kg, previousSnapshot.value?.weight_kg, 'kg', 2)
)

async function loadSnapshots() {
  if (!props.entityId) return

  loading.value = true
  formError.value = null

  try {
    snapshots.value = await apiRequest(`/entity/${props.entityId}/body-snapshots`)
    emit('updated', snapshots.value)
  } catch (err) {
    formError.value = err.message
  } finally {
    loading.value = false
  }
}

async function saveSnapshot() {
  saving.value = true
  formError.value = null

  const payload = formToPayload(form)
  const hasAny =
    payload.height_cm != null ||
    payload.weight_kg != null ||
    payload.skin_tone ||
    payload.chest_cm != null ||
    payload.waist_cm != null ||
    payload.hips_cm != null ||
    payload.shoulder_cm != null ||
    payload.inseam_cm != null ||
    payload.notes

  if (!hasAny) {
    formError.value = 'Uzupełnij przynajmniej jedno pole pomiaru.'
    saving.value = false
    return
  }

  try {
    if (editingId.value) {
      await apiRequest(`/entity/${props.entityId}/body-snapshots/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest(`/entity/${props.entityId}/body-snapshots`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    cancelEdit()
    await loadSnapshots()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function removeSnapshot(row) {
  if (!confirm('Usunąć ten wpis z historii?')) return

  try {
    await apiRequest(`/entity/${props.entityId}/body-snapshots/${row.id}`, {
      method: 'DELETE',
    })
    if (editingId.value === row.id) cancelEdit()
    await loadSnapshots()
  } catch (err) {
    formError.value = err.message
  }
}

function startEdit(row) {
  editingId.value = row.id
  Object.assign(form, snapshotToForm(row))
}

function cancelEdit() {
  editingId.value = null
  Object.assign(form, emptyBodyForm())
}

function bodyMeasuresSummary(row) {
  const parts = bodyMeasureFields
    .filter((f) => row[f.key] != null)
    .map((f) => `${f.label} ${row[f.key]}`)

  return parts.length ? parts.join(' · ') : '—'
}

watch(
  () => props.entityId,
  () => {
    cancelEdit()
    loadSnapshots()
  },
  { immediate: true }
)
</script>
