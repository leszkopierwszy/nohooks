<template>
  <div class="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">
          {{ t('nav.style') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('style.subtitle') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          to="/calendar"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {{ t('outfit.viewCalendar') }}
        </RouterLink>
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          @click="openCreate"
        >
          {{ t('outfit.add') }}
        </button>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <label for="style-prim-filter" class="text-sm font-medium text-gray-700">
        {{ t('outfit.prim') }}
      </label>
      <select
        id="style-prim-filter"
        v-model="primFilter"
        class="rounded-md border-0 py-2 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
      >
        <option value="">{{ t('style.allPrims') }}</option>
        <option v-for="prim in prims" :key="prim.id" :value="String(prim.id)">
          {{ prim.name }}
        </option>
      </select>
    </div>

    <p v-if="outfitsStore.error" class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
      {{ outfitsStore.error }}
    </p>
    <p v-else-if="outfitsStore.loading" class="mt-6 text-sm text-gray-500">
      {{ t('common.loading') }}
    </p>

    <div v-else-if="groupedOutfits.length" class="mt-8 space-y-8">
      <section v-for="group in groupedOutfits" :key="group.date">
        <h2 class="text-sm font-semibold text-gray-900">
          {{ formatEventDate(group.date) }}
        </h2>
        <ul class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="outfit in group.outfits"
            :key="outfit.id"
            class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ outfit.entity?.name ?? t('outfit.prim') }}
                </p>
                <p v-if="outfit.label" class="mt-0.5 text-xs text-gray-500">
                  {{ outfit.label }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  {{ t('outfit.itemCount', { count: outfit.items?.length ?? 0 }) }}
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  @click="openEdit(outfit)"
                >
                  {{ t('outfit.edit') }}
                </button>
                <button
                  type="button"
                  class="text-xs font-medium text-gray-500 hover:text-gray-800"
                  @click="requestRemove(outfit)"
                >
                  {{ t('outfit.delete') }}
                </button>
              </div>
            </div>
            <div v-if="outfit.items?.length" class="mt-3 flex flex-wrap gap-1.5">
              <div
                v-for="item in outfit.items.slice(0, 8)"
                :key="item.id"
                class="size-10 overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200"
                :title="item.name"
              >
                <img
                  v-if="itemThumb(item)"
                  :src="itemThumb(item)"
                  :alt="item.name"
                  class="size-full object-cover"
                />
              </div>
            </div>
            <RouterLink
              :to="{ path: '/calendar', query: { date: wearDateKey(outfit) } }"
              class="mt-3 inline-block text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              {{ t('style.openDay') }}
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

    <p v-else class="mt-10 text-sm text-gray-500">
      {{ t('style.empty') }}
    </p>

    <OutfitFormModal
      :open="formOpen"
      :editing-id="editingId"
      :saving="saving"
      :form-error="formError"
      :form="form"
      :prims="prims"
      :items="collectionItems"
      @close="closeForm"
      @submit="submitForm"
    />

    <ConfirmDialog
      :open="deleteOpen"
      :title="t('outfit.delete')"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      :loading="deleting"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import OutfitFormModal from '../components/outfit/OutfitFormModal.vue'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import { useCollectionStore } from '../stores/collection'
import { useOutfitsStore, wearDateKey } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'
import { addDaysToDateKey, formatEventDate, toDateKey } from '../utils/calendarGrid'

const { t } = useI18n()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()
const collectionStore = useCollectionStore()

const primFilter = ref('')
const formOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const emptyForm = () => ({
  entity_id: '',
  wear_date: toDateKey(new Date()),
  label: '',
  notes: '',
  item_ids: [],
})

const form = reactive(emptyForm())

const prims = computed(() => personasStore.prims)
const collectionItems = computed(() => collectionStore.allItemsList)

const filteredOutfits = computed(() => {
  let rows = outfitsStore.outfits
  if (primFilter.value) {
    rows = rows.filter((o) => String(o.entity_id) === primFilter.value)
  }
  return rows.slice().sort((a, b) => wearDateKey(a).localeCompare(wearDateKey(b)))
})

const groupedOutfits = computed(() => {
  const map = new Map()
  for (const outfit of filteredOutfits.value) {
    const date = wearDateKey(outfit)
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(outfit)
  }
  return [...map.entries()].map(([date, outfits]) => ({ date, outfits }))
})

const deleteMessage = computed(() => {
  const outfit = deleteTarget.value
  if (!outfit) return ''
  return t('outfit.deleteConfirm', {
    prim: outfit.entity?.name ?? t('outfit.prim'),
    date: formatEventDate(wearDateKey(outfit)),
  })
})

function itemThumb(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

async function loadOutfits() {
  const from = toDateKey(new Date())
  const to = addDaysToDateKey(from, 30)
  const params = { from, to }
  if (primFilter.value) params.entity_id = primFilter.value
  await outfitsStore.fetchOutfits(params)
}

function resetForm(dateKey) {
  Object.assign(form, emptyForm())
  form.wear_date = dateKey || toDateKey(new Date())
  if (primFilter.value) {
    form.entity_id = primFilter.value
  } else if (personasStore.activePrim) {
    form.entity_id = String(personasStore.activePrim.id)
  } else if (prims.value[0]) {
    form.entity_id = String(prims.value[0].id)
  }
}

async function ensureFormData() {
  const jobs = []
  if (!personasStore.personas.length) jobs.push(personasStore.fetchPersonas())
  if (!collectionStore.allItemsList.length) jobs.push(collectionStore.fetchAllItems())
  if (jobs.length) await Promise.all(jobs)
}

function openCreate() {
  editingId.value = null
  formError.value = ''
  resetForm()
  formOpen.value = true
  ensureFormData().catch(() => {})
}

function openEdit(outfit) {
  editingId.value = outfit.id
  formError.value = ''
  Object.assign(form, {
    entity_id: String(outfit.entity_id ?? outfit.entity?.id ?? ''),
    wear_date: wearDateKey(outfit),
    label: outfit.label ?? '',
    notes: outfit.notes ?? '',
    item_ids: (outfit.items ?? []).map((item) => item.id),
  })
  formOpen.value = true
  ensureFormData().catch(() => {})
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
  formError.value = ''
}

async function submitForm() {
  if (!form.entity_id || !form.wear_date) {
    formError.value = t('outfit.primPlaceholder')
    return
  }
  saving.value = true
  formError.value = ''
  const payload = {
    entity_id: Number(form.entity_id),
    wear_date: form.wear_date,
    label: form.label?.trim() || null,
    notes: form.notes?.trim() || null,
    item_ids: (form.item_ids ?? []).map((id) => Number(id)),
    source: 'manual',
  }
  try {
    if (editingId.value) {
      await outfitsStore.updateOutfit(editingId.value, payload)
    } else {
      await outfitsStore.createOutfit(payload)
    }
    closeForm()
    await loadOutfits().catch(() => {})
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

function requestRemove(outfit) {
  deleteTarget.value = outfit
  deleteOpen.value = true
}

async function confirmDelete() {
  const outfit = deleteTarget.value
  if (!outfit || deleting.value) return
  deleting.value = true
  try {
    await outfitsStore.deleteOutfit(outfit.id)
    deleteOpen.value = false
    deleteTarget.value = null
  } catch (err) {
    formError.value = err.message
  } finally {
    deleting.value = false
  }
}

watch(primFilter, () => {
  loadOutfits().catch(() => {})
})

onMounted(() => {
  personasStore.fetchPersonas().catch(() => {})
  loadOutfits().catch(() => {})
})
</script>
