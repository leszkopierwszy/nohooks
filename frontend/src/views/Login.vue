<template>
  <div class="flex min-h-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
    <div class="mx-auto w-full max-w-md">
      <RouterLink
        to="/"
        class="text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← {{ siteConfig.appName }}
      </RouterLink>

      <h1 class="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle') }}
      </p>

      <p
        v-if="info"
        class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      >
        {{ info }}
      </p>

      <form v-if="!verificationPending" class="mt-8 space-y-4" @submit.prevent="submit">
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

      <div v-else class="mt-8 space-y-4">
        <p class="text-sm text-gray-600 dark:text-zinc-300">
          {{ t('auth.verifyEmailSent') }}
        </p>
        <button
          type="button"
          class="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          :disabled="resendLoading"
          @click="resend"
        >
          {{ resendLoading ? t('common.loading') : t('auth.resendVerification') }}
        </button>
        <button
          type="button"
          class="w-full text-sm font-medium text-indigo-600 hover:text-indigo-500"
          @click="backToLogin"
        >
          {{ t('auth.switchToLogin') }}
        </button>
      </div>

      <p v-if="!verificationPending" class="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
        <button type="button" class="font-medium text-indigo-600 hover:text-indigo-500" @click="toggleMode">
          {{ mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin') }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useAuthStore } from '../stores/auth'
import { useSiteConfigStore } from '../stores/siteConfig'
import { resendVerificationRequest } from '../api/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const siteConfig = useSiteConfigStore()
const router = useRouter()
const route = useRoute()

const mode = ref('login')
const error = ref('')
const info = ref('')
const verificationPending = ref(false)
const resendLoading = ref(false)

const form = reactive({
  displayName: '',
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
})

function syncModeFromQuery() {
  if (route.query.mode === 'register') {
    mode.value = 'register'
  } else {
    mode.value = 'login'
  }
  if (route.query.verified === '1') {
    info.value = t('auth.verifiedSuccess')
  }
}

onMounted(() => {
  siteConfig.load()
  syncModeFromQuery()
})

watch(() => route.query, syncModeFromQuery)

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
  info.value = ''
  verificationPending.value = false
}

function backToLogin() {
  mode.value = 'login'
  verificationPending.value = false
  error.value = ''
}

async function resend() {
  resendLoading.value = true
  error.value = ''
  try {
    await resendVerificationRequest(form.email.trim())
    info.value = t('auth.resendVerificationSent')
  } catch (err) {
    error.value = err?.message || t('auth.errorGeneric')
  } finally {
    resendLoading.value = false
  }
}

async function submit() {
  error.value = ''
  info.value = ''
  try {
    if (mode.value === 'login') {
      await authStore.login({
        email: form.email.trim(),
        password: form.password,
      })
    } else {
      const data = await authStore.register({
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      if (data?.emailVerificationRequired && !data?.token) {
        verificationPending.value = true
        info.value = t('auth.verifyEmailSent')
        return
      }
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
