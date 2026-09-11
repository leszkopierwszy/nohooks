<template>
  <div class="mx-auto max-w-2xl">
    <header class="border-b border-gray-200 pb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">{{ t('account.title') }}</h1>
      <p class="mt-1 text-sm text-gray-500">{{ t('account.subtitle') }}</p>
    </header>

    <form class="mt-8 space-y-8" @submit.prevent="saveProfile">
      <section class="flex items-start gap-5">
        <img
          :src="avatarPreview"
          alt=""
          class="size-16 rounded-full bg-gray-100 object-cover outline -outline-offset-1 outline-black/5"
        />
        <div class="min-w-0 flex-1">
          <label for="account-avatar" class="block text-sm font-medium text-gray-700">
            {{ t('account.avatarUrl') }}
          </label>
          <input
            id="account-avatar"
            v-model="form.avatar"
            type="url"
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600"
            placeholder="https://…"
          />
        </div>
      </section>

      <section class="grid gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="account-display-name" class="block text-sm font-medium text-gray-700">
            {{ t('account.displayName') }}
          </label>
          <input
            id="account-display-name"
            v-model="form.displayName"
            type="text"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label for="account-username" class="block text-sm font-medium text-gray-700">
            {{ t('account.username') }}
          </label>
          <input
            id="account-username"
            v-model="form.username"
            type="text"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label for="account-email" class="block text-sm font-medium text-gray-700">
            {{ t('account.email') }}
          </label>
          <input
            id="account-email"
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="account-bio" class="block text-sm font-medium text-gray-700">{{ t('account.bio') }}</label>
          <textarea
            id="account-bio"
            v-model="form.bio"
            rows="3"
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </section>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          {{ t('account.saveProfile') }}
        </button>
        <p v-if="savedHint" class="text-sm text-emerald-600">{{ savedHint }}</p>
      </div>
    </form>

    <section class="mt-12 space-y-8 border-t border-gray-200 pt-8">
      <DisplayThemeSettings />
      <DisplayLocaleSettings />
      <DisplayZoomSettings />
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DisplayThemeSettings from '../components/account/DisplayThemeSettings.vue'
import DisplayLocaleSettings from '../components/account/DisplayLocaleSettings.vue'
import DisplayZoomSettings from '../components/account/DisplayZoomSettings.vue'
import { useI18n } from '../composables/useI18n'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const form = reactive({
  displayName: '',
  username: '',
  email: '',
  avatar: '',
  bio: '',
})

const savedHint = ref('')

const avatarPreview = computed(
  () =>
    form.avatar?.trim() ||
    user.value?.avatar ||
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
)

function syncFormFromUser() {
  if (!user.value) return
  form.displayName = user.value.displayName ?? ''
  form.username = user.value.username ?? ''
  form.email = user.value.email ?? ''
  form.avatar = user.value.avatar ?? ''
  form.bio = user.value.bio ?? ''
}

watch(user, syncFormFromUser, { immediate: true })

function saveProfile() {
  userStore.updateProfile({
    displayName: form.displayName.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    avatar: form.avatar.trim(),
    bio: form.bio.trim(),
  })
  savedHint.value = t('account.saved')
  window.setTimeout(() => {
    savedHint.value = ''
  }, 2500)
}
</script>
