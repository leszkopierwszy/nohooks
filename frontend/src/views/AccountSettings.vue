<template>
  <div>
    <header class="pb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{{ t('account.title') }}</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{{ t('account.subtitle') }}</p>
    </header>

    <TabGroup as="div">
      <TabList class="-mb-px flex space-x-6 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        <Tab
          v-for="tab in tabs"
          :key="tab.id"
          v-slot="{ selected }"
          as="template"
        >
          <button
            type="button"
            :class="[
              selected
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200',
              'border-b-2 px-1 py-3 text-base font-medium whitespace-nowrap focus:outline-none',
            ]"
          >
            {{ tab.label }}
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-8">
        <TabPanel class="focus:outline-none">
          <form class="space-y-8" @submit.prevent="saveProfile">
            <section class="flex items-start gap-5">
              <img
                :src="avatarPreview"
                alt=""
                class="size-16 rounded-full bg-gray-100 object-cover outline -outline-offset-1 outline-black/5"
              />
              <div class="min-w-0 flex-1">
                <label for="account-avatar" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.avatarUrl') }}
                </label>
                <input
                  id="account-avatar"
                  v-model="form.avatar"
                  type="url"
                  class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                  placeholder="https://…"
                />
              </div>
            </section>

            <section class="grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label for="account-display-name" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.displayName') }}
                </label>
                <input
                  id="account-display-name"
                  v-model="form.displayName"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
              </div>
              <div>
                <label for="account-username" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.username') }}
                </label>
                <input
                  id="account-username"
                  v-model="form.username"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="account-bio" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">{{ t('account.bio') }}</label>
                <textarea
                  id="account-bio"
                  v-model="form.bio"
                  rows="3"
                  class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
              </div>
              <div>
                <label for="account-net-salary" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.netSalary') }}
                </label>
                <input
                  id="account-net-salary"
                  v-model="form.netSalaryPln"
                  type="number"
                  min="0"
                  step="0.01"
                  class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">{{ t('account.netSalaryHint') }}</p>
              </div>
            </section>

            <div class="flex items-center gap-3">
              <button
                type="submit"
                class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                :disabled="profileSaving"
              >
                {{ t('account.saveProfile') }}
              </button>
              <p v-if="savedHint" class="text-sm text-emerald-600">{{ savedHint }}</p>
              <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
            </div>
          </form>
        </TabPanel>

        <TabPanel class="space-y-10 focus:outline-none">
          <section class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">{{ t('account.emailSection.title') }}</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{{ t('account.emailSection.subtitle') }}</p>
            </div>
            <form class="space-y-4" @submit.prevent="saveEmail">
              <div>
                <label for="account-email" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.email') }}
                </label>
                <input
                  id="account-email"
                  v-model="form.email"
                  type="email"
                  required
                  class="mt-1 block w-full max-w-md rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  :disabled="emailSaving"
                >
                  {{ t('account.emailSection.save') }}
                </button>
                <p v-if="emailHint" class="text-sm text-emerald-600">{{ emailHint }}</p>
                <p v-if="emailError" class="text-sm text-rose-600">{{ emailError }}</p>
              </div>
            </form>
          </section>

          <section class="space-y-4 border-t border-gray-200 pt-8 dark:border-zinc-800">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">{{ t('account.password.title') }}</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{{ t('account.password.subtitle') }}</p>
            </div>

            <form class="space-y-4" @submit.prevent="savePassword">
              <div>
                <label for="account-current-password" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.password.current') }}
                </label>
                <input
                  id="account-current-password"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  required
                  autocomplete="current-password"
                  class="mt-1 block w-full max-w-md rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                />
              </div>
              <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
                <div>
                  <label for="account-new-password" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {{ t('account.password.new') }}
                  </label>
                  <input
                    id="account-new-password"
                    v-model="passwordForm.password"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                  />
                </div>
                <div>
                  <label for="account-new-password-confirm" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {{ t('account.password.confirm') }}
                  </label>
                  <input
                    id="account-new-password-confirm"
                    v-model="passwordForm.password_confirmation"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  :disabled="passwordSaving"
                >
                  {{ t('account.password.save') }}
                </button>
                <p v-if="passwordHint" class="text-sm text-emerald-600">{{ passwordHint }}</p>
                <p v-if="passwordError" class="text-sm text-rose-600">{{ passwordError }}</p>
              </div>
            </form>
          </section>

          <AccountBackupSettings />
        </TabPanel>

        <TabPanel class="focus:outline-none">
          <div class="rounded-lg border border-dashed border-gray-300 px-6 py-10 dark:border-zinc-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">{{ t('account.tabs.notifications') }}</h2>
            <p class="mt-2 max-w-lg text-sm text-gray-500 dark:text-zinc-400">{{ t('account.placeholders.notifications') }}</p>
          </div>
        </TabPanel>

        <TabPanel class="focus:outline-none">
          <div class="rounded-lg border border-dashed border-gray-300 px-6 py-10 dark:border-zinc-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">{{ t('account.tabs.payments') }}</h2>
            <p class="mt-2 max-w-lg text-sm text-gray-500 dark:text-zinc-400">{{ t('account.placeholders.payments') }}</p>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import AccountBackupSettings from '../components/account/AccountBackupSettings.vue'
import { useI18n } from '../composables/useI18n'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { userAvatarDataUrl } from '../utils/userAvatar'

const { t } = useI18n()
const authStore = useAuthStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const tabs = computed(() => [
  { id: 'profile', label: t('account.tabs.profile') },
  { id: 'security', label: t('account.tabs.security') },
  { id: 'notifications', label: t('account.tabs.notifications') },
  { id: 'payments', label: t('account.tabs.payments') },
])

const form = reactive({
  displayName: '',
  username: '',
  email: '',
  avatar: '',
  bio: '',
  netSalaryPln: '',
})

const passwordForm = reactive({
  currentPassword: '',
  password: '',
  password_confirmation: '',
})

const savedHint = ref('')
const profileError = ref('')
const profileSaving = ref(false)
const emailHint = ref('')
const emailError = ref('')
const emailSaving = ref(false)
const passwordHint = ref('')
const passwordError = ref('')
const passwordSaving = ref(false)

const avatarPreview = computed(() => {
  if (form.avatar?.trim()) return form.avatar.trim()
  if (user.value?.avatar) return user.value.avatar
  return userAvatarDataUrl(user.value || { displayName: form.displayName || form.username })
})

function profilePayload() {
  return {
    displayName: form.displayName.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    avatar: form.avatar.trim(),
    bio: form.bio.trim(),
    netSalaryPln: form.netSalaryPln === '' ? 0 : Number(form.netSalaryPln),
  }
}

function syncFormFromUser() {
  if (!user.value) return
  form.displayName = user.value.displayName ?? ''
  form.username = user.value.username ?? ''
  form.email = user.value.email ?? ''
  form.avatar = user.value.avatar ?? ''
  form.bio = user.value.bio ?? ''
  form.netSalaryPln =
    user.value.netSalaryPln != null && user.value.netSalaryPln !== ''
      ? String(user.value.netSalaryPln)
      : ''
}

watch(user, syncFormFromUser, { immediate: true })

async function saveProfile() {
  profileError.value = ''
  savedHint.value = ''
  profileSaving.value = true
  try {
    await authStore.updateProfile(profilePayload())
    savedHint.value = t('account.saved')
    window.setTimeout(() => {
      savedHint.value = ''
    }, 2500)
  } catch (err) {
    profileError.value = err?.message || t('account.saveError')
  } finally {
    profileSaving.value = false
  }
}

async function saveEmail() {
  emailError.value = ''
  emailHint.value = ''
  emailSaving.value = true
  try {
    await authStore.updateProfile(profilePayload())
    emailHint.value = t('account.saved')
    window.setTimeout(() => {
      emailHint.value = ''
    }, 2500)
  } catch (err) {
    emailError.value = err?.message || t('account.saveError')
  } finally {
    emailSaving.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordHint.value = ''
  passwordSaving.value = true
  try {
    await authStore.updatePassword({
      currentPassword: passwordForm.currentPassword,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    })
    passwordForm.currentPassword = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    passwordHint.value = t('account.password.saved')
    window.setTimeout(() => {
      passwordHint.value = ''
    }, 2500)
  } catch (err) {
    passwordError.value = err?.message || t('account.password.error')
  } finally {
    passwordSaving.value = false
  }
}
</script>
