<template>
  <div>
    <header class="pb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{{ t('account.title') }}</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{{ t('account.subtitle') }}</p>
    </header>

    <TabGroup as="div" :selected-index="selectedTabIndex" @change="onTabChange">
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
                class="size-16 shrink-0 rounded-full bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-zinc-800"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {{ t('account.avatar.label') }}
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                    :disabled="avatarSaving"
                    @click="pickAvatarFile"
                  >
                    {{ hasAvatar ? t('account.avatar.change') : t('account.avatar.upload') }}
                  </button>
                  <button
                    v-if="hasAvatar"
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:opacity-60 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
                    :disabled="avatarSaving"
                    @click="removeAvatar"
                  >
                    {{ t('account.avatar.remove') }}
                  </button>
                </div>
                <input
                  ref="avatarFileInput"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="onAvatarFileSelected"
                />
                <p v-if="avatarHint" class="mt-2 text-sm text-emerald-600">{{ avatarHint }}</p>
                <p v-if="avatarError" class="mt-2 text-sm text-rose-600">{{ avatarError }}</p>
              </div>
            </section>

            <AvatarCropModal
              :open="cropOpen"
              :file="cropFile"
              :saving="avatarSaving"
              @close="closeCrop"
              @confirm="uploadCroppedAvatar"
            />

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
          <section class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                {{ t('account.brands.title') }}
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {{ t('account.brands.subtitle') }}
              </p>
            </div>
            <FashionPreferredStores />
          </section>
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
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import AccountBackupSettings from '../components/account/AccountBackupSettings.vue'
import AvatarCropModal from '../components/account/AvatarCropModal.vue'
import FashionPreferredStores from '../components/account/FashionPreferredStores.vue'
import { resolveStorageUrl } from '../api/media'
import { useI18n } from '../composables/useI18n'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { userAvatarDataUrl } from '../utils/userAvatar'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const tabs = computed(() => [
  { id: 'profile', label: t('account.tabs.profile') },
  { id: 'security', label: t('account.tabs.security') },
  { id: 'brands', label: t('account.tabs.brands') },
  { id: 'notifications', label: t('account.tabs.notifications') },
  { id: 'payments', label: t('account.tabs.payments') },
])

const selectedTabIndex = computed(() => {
  const tab = String(route.query.tab || 'profile')
  const idx = tabs.value.findIndex((item) => item.id === tab)
  return idx >= 0 ? idx : 0
})

function onTabChange(index) {
  const tab = tabs.value[index]
  if (!tab) return
  const query = { ...route.query }
  if (tab.id === 'profile') delete query.tab
  else query.tab = tab.id
  router.replace({ query })
}

const form = reactive({
  displayName: '',
  username: '',
  email: '',
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

const avatarFileInput = ref(null)
const cropOpen = ref(false)
const cropFile = ref(null)
const avatarSaving = ref(false)
const avatarHint = ref('')
const avatarError = ref('')

const hasAvatar = computed(() => Boolean(user.value?.avatar?.trim()))

const avatarPreview = computed(() => {
  const raw = user.value?.avatar?.trim()
  if (raw) return resolveStorageUrl(raw) ?? raw
  return userAvatarDataUrl(user.value || { displayName: form.displayName || form.username })
})

function profilePayload() {
  return {
    displayName: form.displayName.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    bio: form.bio.trim(),
    netSalaryPln: form.netSalaryPln === '' ? 0 : Number(form.netSalaryPln),
  }
}

function syncFormFromUser() {
  if (!user.value) return
  form.displayName = user.value.displayName ?? ''
  form.username = user.value.username ?? ''
  form.email = user.value.email ?? ''
  form.bio = user.value.bio ?? ''
  form.netSalaryPln =
    user.value.netSalaryPln != null && user.value.netSalaryPln !== ''
      ? String(user.value.netSalaryPln)
      : ''
}

watch(user, syncFormFromUser, { immediate: true })

function pickAvatarFile() {
  avatarError.value = ''
  avatarHint.value = ''
  avatarFileInput.value?.click()
}

function onAvatarFileSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    avatarError.value = t('account.avatar.uploadError')
    return
  }
  cropFile.value = file
  cropOpen.value = true
}

function closeCrop() {
  if (avatarSaving.value) return
  cropOpen.value = false
  cropFile.value = null
}

async function uploadCroppedAvatar(file) {
  avatarError.value = ''
  avatarHint.value = ''
  avatarSaving.value = true
  try {
    await authStore.uploadAvatar(file)
    cropOpen.value = false
    cropFile.value = null
    avatarHint.value = t('account.avatar.saved')
    window.setTimeout(() => {
      avatarHint.value = ''
    }, 2500)
  } catch (err) {
    avatarError.value = err?.message || t('account.avatar.uploadError')
  } finally {
    avatarSaving.value = false
  }
}

async function removeAvatar() {
  avatarError.value = ''
  avatarHint.value = ''
  avatarSaving.value = true
  try {
    await authStore.deleteAvatar()
    avatarHint.value = t('account.avatar.removed')
    window.setTimeout(() => {
      avatarHint.value = ''
    }, 2500)
  } catch (err) {
    avatarError.value = err?.message || t('account.avatar.removeError')
  } finally {
    avatarSaving.value = false
  }
}

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
