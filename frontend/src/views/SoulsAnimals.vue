<template>
  <div>
    <div class="border-b border-gray-200 pb-6">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ t('souls.animals.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-500">{{ t('souls.animals.subtitle') }}</p>
    </div>

    <div
      v-if="createdNotice"
      class="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 ring-1 ring-emerald-900/5"
      role="status"
    >
      <div class="flex items-center gap-3">
        <AnimalSpeciesIcon
          v-if="createdNotice.species"
          :species="createdNotice.species"
          size="sm"
        />
        <h2 class="text-sm font-semibold text-emerald-900">{{ t('souls.animals.expenseAccount.createdTitle') }}</h2>
      </div>
      <p class="mt-2 text-sm text-emerald-800">
        {{
          t('souls.animals.expenseAccount.createdBody', {
            name: createdNotice.animalName,
            account: createdNotice.accountName,
          })
        }}
      </p>
      <p class="mt-2 text-xs text-emerald-700/90">{{ t('souls.animals.expenseAccount.trackHint') }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <router-link
          :to="{ name: 'FinanceMockAssets' }"
          class="inline-flex rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {{ t('souls.animals.expenseAccount.viewFinance') }}
        </router-link>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
          @click="createdNotice = null"
        >
          OK
        </button>
      </div>
    </div>

    <form
      v-if="showForm"
      class="mt-8 max-w-xl rounded-xl border border-gray-200 bg-gray-50/80 p-5 ring-1 ring-gray-900/5"
      @submit.prevent="submitAnimal"
    >
      <h2 class="text-sm font-semibold text-gray-900">
        {{ formMode === 'edit' ? t('souls.animals.editTitle') : t('souls.animals.new') }}
      </h2>
      <p v-if="formLoading" class="mt-2 text-sm text-gray-500">{{ t('common.loading') }}</p>
      <div v-show="!formLoading" class="mt-4 space-y-4">
        <div>
          <label for="animal-name" class="block text-sm font-medium text-gray-700">
            {{ t('souls.animals.name') }}
          </label>
          <input
            id="animal-name"
            ref="nameInputRef"
            v-model="form.name"
            type="text"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            :placeholder="t('souls.animals.namePlaceholder')"
          />
        </div>

        <div>
          <label for="animal-species" class="block text-sm font-medium text-gray-700">
            {{ t('souls.animals.species') }}
          </label>
          <div class="mt-1 flex items-center gap-3">
            <AnimalSpeciesIcon
              v-if="form.species"
              :species="form.species"
              :label="speciesLabel(form.species)"
            />
            <select
              id="animal-species"
              v-model="form.species"
              required
              class="block min-w-0 flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="" disabled>{{ t('souls.animals.speciesPlaceholder') }}</option>
              <option v-for="opt in speciesOptions" :key="opt.value" :value="opt.value">
                {{ opt.emoji }} {{ t(opt.labelKey) }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="animal-sex" class="block text-sm font-medium text-gray-700">
              {{ t('souls.animals.sexLabel') }}
            </label>
            <select
              id="animal-sex"
              v-model="form.sex"
              class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">{{ t('souls.animals.sex.unknown') }}</option>
              <option v-for="opt in sexOptions" :key="opt.value" :value="opt.value">
                {{ t(opt.labelKey) }}
              </option>
            </select>
          </div>
          <div>
            <label for="animal-birth" class="block text-sm font-medium text-gray-700">
              {{ t('souls.animals.birthDate') }}
            </label>
            <input
              id="animal-birth"
              v-model="form.birthDate"
              type="date"
              class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        <fieldset class="rounded-lg border border-gray-200/80 bg-white/60 p-4">
          <legend class="px-1 text-sm font-medium text-gray-900">{{ t('souls.animals.biometrics') }}</legend>
          <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="animal-weight" class="block text-xs font-medium text-gray-600">
                {{ t('souls.animals.weightKg') }}
              </label>
              <input
                id="animal-weight"
                v-model="form.weightKg"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label for="animal-height" class="block text-xs font-medium text-gray-600">
                {{ t('souls.animals.heightCm') }}
              </label>
              <input
                id="animal-height"
                v-model="form.heightCm"
                type="number"
                min="0"
                step="0.1"
                class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>
          <div class="mt-4">
            <label for="animal-chip" class="block text-xs font-medium text-gray-600">
              {{ t('souls.animals.microchip') }}
            </label>
            <input
              id="animal-chip"
              v-model="form.microchip"
              type="text"
              class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </fieldset>

        <div>
          <label for="animal-frequency" class="block text-sm font-medium text-gray-700">
            {{ t('souls.animals.frequency.label') }}
          </label>
          <select
            id="animal-frequency"
            v-model="form.expenseFrequency"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          >
            <option v-for="opt in frequencyOptions" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </div>

        <div>
          <label for="animal-desc" class="block text-sm font-medium text-gray-700">
            {{ t('souls.animals.description') }}
          </label>
          <textarea
            id="animal-desc"
            v-model="form.description"
            rows="2"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
            :placeholder="t('souls.animals.descriptionPlaceholder')"
          />
        </div>
      </div>
      <div v-show="!formLoading" class="mt-5 flex gap-2">
        <button
          type="submit"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          :disabled="saving"
        >
          {{
            saving
              ? t('souls.animals.adding')
              : formMode === 'edit'
                ? t('souls.animals.save')
                : t('souls.animals.add')
          }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          @click="cancelForm"
        >
          {{ t('souls.animals.cancel') }}
        </button>
      </div>
      <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
    </form>

    <div v-else-if="!createdNotice" class="mt-8">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        @click="openAddForm"
      >
        <PlusIcon class="size-4" aria-hidden="true" />
        {{ t('souls.animals.add') }}
      </button>
    </div>

    <p v-if="personasStore.loading" class="mt-8 text-sm text-gray-500">{{ t('common.loading') }}</p>
    <p v-else-if="personasStore.error" class="mt-8 text-sm text-red-600">{{ personasStore.error }}</p>

    <ul
      v-else
      role="list"
      class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <li
        v-for="animal in personasStore.animals"
        :key="animal.id"
        :class="[
          'rounded-xl border bg-white p-5 shadow-sm ring-1',
          editingAnimalId === animal.id
            ? 'border-indigo-300 ring-indigo-200'
            : 'border-gray-200 ring-gray-900/5',
        ]"
      >
        <div class="flex items-start gap-4">
          <AnimalSpeciesIcon
            :species="animal.species"
            :label="speciesLabel(animal.species)"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-medium text-gray-900">{{ animal.name }}</h3>
              <div class="flex shrink-0 gap-1">
                <button
                  type="button"
                  class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  :aria-label="t('souls.animals.edit')"
                  @click="openEdit(animal)"
                >
                  <PencilSquareIcon class="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  :aria-label="t('souls.animals.delete')"
                  @click="openDeleteModal(animal)"
                >
                  <TrashIcon class="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ t('souls.animals.card.speciesLabel') }}:
              {{ speciesLabel(animal.species) }}
            </p>
            <p v-if="animal.description" class="mt-2 text-sm text-gray-500">{{ animal.description }}</p>
            <p v-if="petAccount(animal.id)" class="mt-3">
              <router-link
                :to="{ name: 'FinanceMockAssets' }"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {{ t('souls.animals.card.expenseLink') }} →
              </router-link>
            </p>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-if="!personasStore.loading && !personasStore.animals.length && !showForm && !createdNotice"
      class="mt-8 text-sm text-gray-500"
    >
      {{ t('souls.animals.empty') }}
    </p>

    <ConfirmDialog
      :open="deleteModalOpen"
      :title="t('souls.animals.deleteConfirmTitle')"
      :message="deleteMessage"
      :confirm-label="t('souls.animals.delete')"
      variant="danger"
      :loading="deleting"
      @close="closeDeleteModal"
      @confirm="confirmDeleteAnimal"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AnimalSpeciesIcon from '../components/AnimalSpeciesIcon.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useI18n } from '../composables/useI18n'
import {
  ANIMAL_SPECIES,
  ANIMAL_SEX_OPTIONS,
  PET_EXPENSE_FREQUENCIES,
} from '../constants/animalSpecies'
import { usePersonasStore } from '../stores/personas'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const personasStore = usePersonasStore()
const petAccountsStore = usePetExpenseAccountsStore()

const speciesOptions = ANIMAL_SPECIES
const sexOptions = ANIMAL_SEX_OPTIONS
const frequencyOptions = PET_EXPENSE_FREQUENCIES

const showForm = ref(false)
const formMode = ref('create')
const editingAnimalId = ref(null)
const latestSnapshotId = ref(null)
const formLoading = ref(false)
const saving = ref(false)
const formError = ref('')
const nameInputRef = ref(null)
const createdNotice = ref(null)
const deleteModalOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const deleteError = ref('')

const deleteMessage = computed(() =>
  deleteTarget.value
    ? t('souls.animals.deleteConfirmBody', { name: deleteTarget.value.name })
    : '',
)

const form = reactive({
  name: '',
  species: '',
  sex: '',
  birthDate: '',
  weightKg: '',
  heightCm: '',
  microchip: '',
  description: '',
  expenseFrequency: 'monthly',
})

onMounted(() => {
  petAccountsStore.reload()
  personasStore.fetchPersonas().catch(() => {})
  if (route.query.add === '1') {
    openAddForm()
  }
})

watch(
  () => route.query.add,
  (value) => {
    if (value === '1') openAddForm()
  },
)

function speciesLabel(value) {
  if (!value) return '—'
  const key = `souls.animals.speciesTypes.${value}`
  const label = t(key)
  return label === key ? value : label
}

function petAccount(entityId) {
  return petAccountsStore.byEntityId(entityId)
}

function resetForm() {
  latestSnapshotId.value = null
  Object.assign(form, {
    name: '',
    species: '',
    sex: '',
    birthDate: '',
    weightKg: '',
    heightCm: '',
    microchip: '',
    description: '',
    expenseFrequency: 'monthly',
  })
}

function formatDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function openAddForm() {
  createdNotice.value = null
  formMode.value = 'create'
  editingAnimalId.value = null
  showForm.value = true
  resetForm()
  formError.value = ''
  nextTick(() => nameInputRef.value?.focus())
}

async function openEdit(animal) {
  createdNotice.value = null
  formMode.value = 'edit'
  editingAnimalId.value = animal.id
  showForm.value = true
  formError.value = ''
  formLoading.value = true

  try {
    const full = await personasStore.fetchPersona(animal.id)
    const snapshots = full.body_snapshots ?? full.bodySnapshots ?? []
    const snap = snapshots[0] ?? null
    const custom = snap?.custom_measurements ?? {}
    const account = petAccountsStore.byEntityId(animal.id)

    latestSnapshotId.value = snap?.id ?? null
    Object.assign(form, {
      name: full.name ?? '',
      species: full.species ?? '',
      sex: full.sex ?? '',
      birthDate: formatDateInput(full.birth_date),
      description: full.description ?? '',
      weightKg: snap?.weight_kg != null ? String(snap.weight_kg) : '',
      heightCm: custom.height_at_withers_cm != null ? String(custom.height_at_withers_cm) : '',
      microchip: custom.microchip ?? '',
      expenseFrequency: account?.default_frequency ?? 'monthly',
    })

    if (!petAccountsStore.byEntityId(animal.id)) {
      petAccountsStore.createForAnimal(full, { species: full.species })
    }

    nextTick(() => nameInputRef.value?.focus())
  } catch (err) {
    formError.value = err.message || t('souls.animals.updateError')
    cancelForm()
  } finally {
    formLoading.value = false
  }
}

function cancelForm() {
  showForm.value = false
  formMode.value = 'create'
  editingAnimalId.value = null
  latestSnapshotId.value = null
  formError.value = ''
  if (route.query.add) {
    router.replace({ name: 'SoulsAnimals' })
  }
}

function buildBiometricsPayload() {
  const custom = {}
  if (form.microchip.trim()) custom.microchip = form.microchip.trim()
  if (form.heightCm !== '' && form.heightCm != null) {
    custom.height_at_withers_cm = Number(form.heightCm)
  }

  const weight =
    form.weightKg !== '' && form.weightKg != null ? Number(form.weightKg) : null
  const hasCustom = Object.keys(custom).length > 0

  if (weight == null && !hasCustom) return null

  return {
    recorded_at: new Date().toISOString().slice(0, 10),
    weight_kg: weight,
    custom_measurements: hasCustom ? custom : undefined,
  }
}

function openDeleteModal(animal) {
  deleteTarget.value = animal
  deleteError.value = ''
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  if (deleting.value) return
  deleteModalOpen.value = false
  deleteTarget.value = null
}

async function confirmDeleteAnimal() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    if (editingAnimalId.value === deleteTarget.value.id) {
      cancelForm()
    }
    await personasStore.deleteAnimal(deleteTarget.value.id)
    closeDeleteModal()
  } catch (err) {
    deleteError.value = err.message || t('souls.animals.deleteError')
    personasStore.error = deleteError.value
  } finally {
    deleting.value = false
  }
}

async function submitAnimal() {
  const name = form.name.trim()
  if (!name || !form.species) return

  saving.value = true
  formError.value = ''
  try {
    const payload = {
      name,
      species: form.species,
      description: form.description,
      birthDate: form.birthDate || null,
      sex: form.sex || null,
      biometrics: buildBiometricsPayload(),
      expenseFrequency: form.expenseFrequency,
    }

    if (formMode.value === 'edit' && editingAnimalId.value) {
      await personasStore.updateAnimal(editingAnimalId.value, {
        ...payload,
        snapshotId: latestSnapshotId.value,
      })
      cancelForm()
    } else {
      const { entity, expenseAccount } = await personasStore.createAnimal(payload)
      showForm.value = false
      createdNotice.value = {
        animalName: entity.name,
        accountName: expenseAccount.account_name,
        species: entity.species,
      }
      if (route.query.add) {
        router.replace({ name: 'SoulsAnimals' })
      }
    }
  } catch (err) {
    formError.value =
      err.message ||
      (formMode.value === 'edit' ? t('souls.animals.updateError') : t('souls.animals.addError'))
  } finally {
    saving.value = false
  }
}
</script>
