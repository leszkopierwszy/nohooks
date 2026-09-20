<template>
  <section class="space-y-4">
    <ul
      v-if="stores.length"
      class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-zinc-800 dark:border-zinc-700"
    >
      <li
        v-for="store in stores"
        :key="store.id"
        class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">
            {{ store.name }}
            <span
              v-if="store.brand && store.brand !== store.name"
              class="font-normal text-gray-500 dark:text-zinc-400"
            >· {{ store.brand }}</span>
          </p>
          <a
            v-if="store.url"
            :href="store.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-0.5 block truncate text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {{ store.url }}
          </a>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          @click="removeStore(store.id)"
        >
          {{ t('style.brands.remove') }}
        </button>
      </li>
    </ul>
    <p
      v-else
      class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400"
    >
      {{ t('style.brands.empty') }}
    </p>

    <form
      class="grid max-w-xl gap-3 sm:grid-cols-2"
      @submit.prevent="addStore"
    >
      <div class="sm:col-span-2">
        <label
          for="fashion-store-url"
          class="block text-sm font-medium text-gray-700 dark:text-zinc-300"
        >
          {{ t('style.brands.url') }}
        </label>
        <input
          id="fashion-store-url"
          v-model="draft.url"
          type="url"
          required
          placeholder="https://www.zara.com/…"
          class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          @blur="autofillFromUrl"
        />
      </div>
      <div>
        <label
          for="fashion-store-name"
          class="block text-sm font-medium text-gray-700 dark:text-zinc-300"
        >
          {{ t('style.brands.name') }}
        </label>
        <input
          id="fashion-store-name"
          v-model="draft.name"
          type="text"
          required
          maxlength="80"
          class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
        />
      </div>
      <div>
        <label
          for="fashion-store-brand"
          class="block text-sm font-medium text-gray-700 dark:text-zinc-300"
        >
          {{ t('style.brands.brand') }}
        </label>
        <input
          id="fashion-store-brand"
          v-model="draft.brand"
          type="text"
          maxlength="80"
          :placeholder="t('style.brands.brandPlaceholder')"
          class="mt-1 block w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
        />
      </div>
      <div class="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          :disabled="saving"
        >
          {{ t('style.brands.add') }}
        </button>
        <p
          v-if="hint"
          class="text-sm text-emerald-600"
        >
          {{ hint }}
        </p>
        <p
          v-if="error"
          class="text-sm text-rose-600"
        >
          {{ error }}
        </p>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from '../../composables/useI18n'
import { useAuthStore } from '../../stores/auth'
import { useUserStore } from '../../stores/user'

const { t } = useI18n()
const authStore = useAuthStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const stores = ref([])
const saving = ref(false)
const hint = ref('')
const error = ref('')
const draft = reactive({
  url: '',
  name: '',
  brand: '',
})

watch(
  user,
  (u) => {
    stores.value = Array.isArray(u?.fashionStores) ? [...u.fashionStores] : []
  },
  { immediate: true, deep: true },
)

const profileBase = computed(() => ({
  displayName: user.value?.displayName ?? '',
  username: user.value?.username ?? '',
  email: user.value?.email ?? '',
  avatar: user.value?.avatar ?? '',
  bio: user.value?.bio ?? '',
  netSalaryPln: user.value?.netSalaryPln ?? 0,
}))

function guessNameFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const root = host.split('.')[0] || host
    return root.charAt(0).toUpperCase() + root.slice(1)
  } catch {
    return ''
  }
}

function autofillFromUrl() {
  const url = draft.url.trim()
  if (!url) return
  const guess = guessNameFromUrl(url)
  if (!draft.name.trim() && guess) draft.name = guess
  if (!draft.brand.trim() && guess) draft.brand = guess
}

async function persist(next) {
  saving.value = true
  error.value = ''
  hint.value = ''
  try {
    await authStore.updateProfile({
      ...profileBase.value,
      fashionStores: next,
    })
    stores.value = next
    hint.value = t('style.brands.saved')
    window.setTimeout(() => {
      hint.value = ''
    }, 2000)
  } catch (err) {
    error.value = err?.message || t('style.brands.saveError')
  } finally {
    saving.value = false
  }
}

async function addStore() {
  autofillFromUrl()
  const url = draft.url.trim()
  const name = draft.name.trim()
  if (!url || !name) return
  const entry = {
    id: crypto.randomUUID(),
    name,
    brand: draft.brand.trim() || name,
    url,
  }
  const next = [...stores.value, entry].slice(0, 30)
  await persist(next)
  if (!error.value) {
    draft.url = ''
    draft.name = ''
    draft.brand = ''
  }
}

async function removeStore(id) {
  const next = stores.value.filter((s) => s.id !== id)
  await persist(next)
}
</script>
