<template>
  <div class="flex min-h-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
    <div class="mx-auto w-full max-w-md">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle') }}
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <template v-if="mode === 'register'">
          <div>
            <label for="auth-display-name" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              {{ t('account.displayName') }}
            </label>
            <input
              id="auth-display-name"
              v-model="form.displayName"
              type="text"
              required
              autocomplete="name"
              class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
            />
          </div>
          <div>
            <label for="auth-username" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              {{ t('account.username') }}
            </label>
            <input
              id="auth-username"
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
            />
          </div>
        </template>

        <div>
          <label for="auth-email" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            {{ t('account.email') }}
          </label>
          <input
            id="auth-email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          />
        </div>

        <div>
          <label for="auth-password" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            {{ t('auth.password') }}
          </label>
          <input
            id="auth-password"
            v-model="form.password"
            type="password"
            required
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          />
        </div>

        <div v-if="mode === 'register'">
          <label for="auth-password-confirm" class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            {{ t('auth.passwordConfirm') }}
          </label>
          <input
            id="auth-password-confirm"
            v-model="form.password_confirmation"
            type="password"
            required
            autocomplete="new-password"
            class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          />
        </div>

        <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>

        <button
          type="submit"
          class="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          :disabled="authStore.loading"
        >
          {{
            authStore.loading
              ? t('common.loading')
              : mode === 'login'
                ? t('auth.loginSubmit')
                : t('auth.registerSubmit')
          }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
        <button type="button" class="font-medium text-indigo-600 hover:text-indigo-500" @click="toggleMode">
          {{ mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin') }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref('login')
const error = ref('')

const form = reactive({
  displayName: '',
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
})

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}

async function submit() {
  error.value = ''
  try {
    if (mode.value === 'login') {
      await authStore.login({
        email: form.email.trim(),
        password: form.password,
      })
    } else {
      await authStore.register({
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
    }
    const redirect =
      mode.value === 'register'
        ? '/account'
        : typeof route.query.redirect === 'string'
          ? route.query.redirect
          : '/home'
    await router.replace(redirect || '/home')
  } catch (err) {
    error.value = err?.message || t('auth.errorGeneric')
  }
}
</script>
