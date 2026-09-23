<template>
  <div class="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
    <header class="pb-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900">
            {{ t('admin.styleModules.title') }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            {{ t('admin.styleModules.subtitle') }}
          </p>
        </div>
        <RouterLink
          :to="{ name: 'AccountBackend' }"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← {{ t('account.backend.title') }}
        </RouterLink>
      </div>

      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="tab === 'modules' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
          @click="tab = 'modules'"
        >
          {{ t('admin.styleModules.tabModules') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="tab === 'achievements' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
          @click="tab = 'achievements'"
        >
          {{ t('admin.styleModules.tabAchievements') }}
        </button>
      </div>
    </header>

    <p
      v-if="adminStore.error"
      class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {{ adminStore.error }}
    </p>
    <p
      v-if="hint"
      class="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
    >
      {{ hint }}
    </p>

    <!-- MODULES -->
    <section v-if="tab === 'modules'" class="space-y-6">
      <form
        class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        @submit.prevent="saveModule"
      >
        <h2 class="text-sm font-semibold text-gray-900">
          {{ editingModuleId ? t('admin.styleModules.editModule') : t('admin.styleModules.newModule') }}
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldTitle') }}</label>
            <input
              v-model="moduleForm.title"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldXp') }}</label>
            <input
              v-model.number="moduleForm.xp_reward"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldGender') }}</label>
            <select
              v-model="moduleForm.gender"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">{{ t('admin.styleModules.genderAll') }}</option>
              <option value="female">female</option>
              <option value="male">male</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldMode') }}</label>
            <select
              v-model="moduleForm.completion_mode"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="auto">auto</option>
              <option value="manual">manual</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldSort') }}</label>
            <input
              v-model.number="moduleForm.sort_order"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <label class="flex items-end gap-2 pb-2 text-sm text-gray-700">
            <input
              v-model="moduleForm.is_active"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-indigo-600"
            />
            {{ t('admin.styleModules.fieldActive') }}
          </label>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldDescription') }}</label>
          <textarea
            v-model="moduleForm.description"
            rows="2"
            class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldRequirements') }}</label>
          <textarea
            v-model="moduleForm.requirementsJson"
            rows="5"
            class="mt-1 block w-full rounded-md border-0 py-2 pl-3 font-mono text-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('admin.styleModules.requirementsHint') }}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            :disabled="saving"
          >
            {{ saving ? t('common.loading') : t('admin.styleModules.save') }}
          </button>
          <button
            v-if="editingModuleId"
            type="button"
            class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
            @click="resetModuleForm"
          >
            {{ t('admin.styleModules.cancel') }}
          </button>
        </div>
      </form>

      <div class="space-y-2">
        <article
          v-for="mod in adminStore.modules"
          :key="mod.id"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900">
              {{ mod.title }}
              <span
                v-if="!mod.is_active"
                class="ml-2 text-xs font-normal text-rose-600"
              >(inactive)</span>
            </p>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ mod.completion_mode }} · XP {{ mod.xp_reward }}
              · {{ mod.gender || 'all' }} · #{{ mod.sort_order }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="text-sm font-medium text-indigo-600"
              @click="editModule(mod)"
            >
              {{ t('admin.styleModules.edit') }}
            </button>
            <button
              type="button"
              class="text-sm font-medium text-rose-600"
              @click="removeModule(mod.id)"
            >
              {{ t('admin.styleModules.delete') }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- ACHIEVEMENTS -->
    <section v-else class="space-y-6">
      <form
        class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        @submit.prevent="saveAchievement"
      >
        <h2 class="text-sm font-semibold text-gray-900">
          {{ editingAchievementId ? t('admin.styleModules.editAchievement') : t('admin.styleModules.newAchievement') }}
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium text-gray-600">code</label>
            <input
              v-model="achievementForm.code"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldTitle') }}</label>
            <input
              v-model="achievementForm.title"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldXpBonus') }}</label>
            <input
              v-model.number="achievementForm.xp_bonus"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldSort') }}</label>
            <input
              v-model.number="achievementForm.sort_order"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldDescription') }}</label>
          <textarea
            v-model="achievementForm.description"
            rows="2"
            class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600">{{ t('admin.styleModules.fieldRule') }}</label>
          <textarea
            v-model="achievementForm.ruleJson"
            rows="3"
            class="mt-1 block w-full rounded-md border-0 py-2 pl-3 font-mono text-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('admin.styleModules.ruleHint') }}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            :disabled="saving"
          >
            {{ t('admin.styleModules.save') }}
          </button>
          <button
            v-if="editingAchievementId"
            type="button"
            class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
            @click="resetAchievementForm"
          >
            {{ t('admin.styleModules.cancel') }}
          </button>
        </div>
      </form>

      <div class="space-y-2">
        <article
          v-for="row in adminStore.achievements"
          :key="row.id"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
        >
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ row.title }}</p>
            <p class="text-xs text-gray-500">{{ row.code }} · bonus {{ row.xp_bonus ?? 0 }} XP</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="text-sm font-medium text-indigo-600"
              @click="editAchievement(row)"
            >
              {{ t('admin.styleModules.edit') }}
            </button>
            <button
              type="button"
              class="text-sm font-medium text-rose-600"
              @click="removeAchievement(row.id)"
            >
              {{ t('admin.styleModules.delete') }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useAdminStyleStore } from '../stores/adminStyle'

const { t } = useI18n()
const adminStore = useAdminStyleStore()

const tab = ref('modules')
const saving = ref(false)
const hint = ref('')
const editingModuleId = ref(null)
const editingAchievementId = ref(null)

const moduleForm = reactive({
  title: '',
  description: '',
  sort_order: 0,
  is_active: true,
  gender: '',
  xp_reward: 25,
  completion_mode: 'auto',
  requirementsJson: JSON.stringify({ all: [{ slot: 'footwear', min: 1 }] }, null, 2),
})

const achievementForm = reactive({
  code: '',
  title: '',
  description: '',
  xp_bonus: 10,
  sort_order: 0,
  ruleJson: JSON.stringify({ type: 'modules_completed', count: 1 }, null, 2),
})

function resetModuleForm() {
  editingModuleId.value = null
  moduleForm.title = ''
  moduleForm.description = ''
  moduleForm.sort_order = 0
  moduleForm.is_active = true
  moduleForm.gender = ''
  moduleForm.xp_reward = 25
  moduleForm.completion_mode = 'auto'
  moduleForm.requirementsJson = JSON.stringify({ all: [{ slot: 'footwear', min: 1 }] }, null, 2)
}

function editModule(mod) {
  editingModuleId.value = mod.id
  moduleForm.title = mod.title
  moduleForm.description = mod.description ?? ''
  moduleForm.sort_order = mod.sort_order ?? 0
  moduleForm.is_active = Boolean(mod.is_active)
  moduleForm.gender = mod.gender ?? ''
  moduleForm.xp_reward = mod.xp_reward ?? 25
  moduleForm.completion_mode = mod.completion_mode ?? 'auto'
  moduleForm.requirementsJson = JSON.stringify(mod.requirements ?? {}, null, 2)
}

async function saveModule() {
  saving.value = true
  hint.value = ''
  try {
    let requirements = {}
    try {
      requirements = JSON.parse(moduleForm.requirementsJson || '{}')
    } catch {
      throw new Error(t('admin.styleModules.invalidJson'))
    }
    await adminStore.saveModule(
      {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        sort_order: Number(moduleForm.sort_order) || 0,
        is_active: Boolean(moduleForm.is_active),
        gender: moduleForm.gender || null,
        xp_reward: Number(moduleForm.xp_reward) || 0,
        completion_mode: moduleForm.completion_mode,
        requirements,
      },
      editingModuleId.value,
    )
    hint.value = t('admin.styleModules.saved')
    resetModuleForm()
  } catch (err) {
    adminStore.error = err.message ?? String(err)
  } finally {
    saving.value = false
  }
}

async function removeModule(id) {
  if (!confirm(t('admin.styleModules.confirmDelete'))) return
  await adminStore.deleteModule(id)
}

function resetAchievementForm() {
  editingAchievementId.value = null
  achievementForm.code = ''
  achievementForm.title = ''
  achievementForm.description = ''
  achievementForm.xp_bonus = 10
  achievementForm.sort_order = 0
  achievementForm.ruleJson = JSON.stringify({ type: 'modules_completed', count: 1 }, null, 2)
}

function editAchievement(row) {
  editingAchievementId.value = row.id
  achievementForm.code = row.code
  achievementForm.title = row.title
  achievementForm.description = row.description ?? ''
  achievementForm.xp_bonus = row.xp_bonus ?? 0
  achievementForm.sort_order = row.sort_order ?? 0
  achievementForm.ruleJson = JSON.stringify(row.rule ?? {}, null, 2)
}

async function saveAchievement() {
  saving.value = true
  hint.value = ''
  try {
    let rule = {}
    try {
      rule = JSON.parse(achievementForm.ruleJson || '{}')
    } catch {
      throw new Error(t('admin.styleModules.invalidJson'))
    }
    await adminStore.saveAchievement(
      {
        code: achievementForm.code.trim().toLowerCase(),
        title: achievementForm.title.trim(),
        description: achievementForm.description.trim() || null,
        xp_bonus: Number(achievementForm.xp_bonus) || 0,
        sort_order: Number(achievementForm.sort_order) || 0,
        rule,
        is_active: true,
      },
      editingAchievementId.value,
    )
    hint.value = t('admin.styleModules.saved')
    resetAchievementForm()
  } catch (err) {
    adminStore.error = err.message ?? String(err)
  } finally {
    saving.value = false
  }
}

async function removeAchievement(id) {
  if (!confirm(t('admin.styleModules.confirmDelete'))) return
  await adminStore.deleteAchievement(id)
}

watch(tab, (v) => {
  if (v === 'achievements' && !adminStore.achievements.length) {
    adminStore.fetchAchievements().catch(() => {})
  }
})

onMounted(async () => {
  await adminStore.fetchModules().catch(() => {})
})
</script>
