<template>
  <div>
    <header class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">{{ t('account.backend.title') }}</h1>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ t('account.backend.subtitle') }}</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="link in quickLinks"
        :key="link.id"
        type="button"
        class="group rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm ring-1 ring-gray-900/5 transition hover:border-stone-300 hover:shadow-md"
        @click="openLink(link)"
      >
        <p class="text-sm font-semibold text-gray-900 group-hover:text-gray-950">{{ link.label }}</p>
        <p class="mt-1.5 text-xs leading-relaxed text-gray-500">{{ link.description }}</p>
        <p class="mt-3 truncate font-mono text-[11px] text-stone-500">{{ link.urlDisplay }}</p>
        <span class="mt-3 inline-flex text-xs font-medium text-stone-600 group-hover:text-gray-900">
          {{ t('account.backend.openLink') }}
          <span class="ml-1" aria-hidden="true">↗</span>
        </span>
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  LANGFUSE_UI_URL,
  MODEL_ASSISTANT_ADD_MODEL,
  MODEL_ASSISTANT_CATALOG,
  MODEL_ASSISTANT_FASHION_AI,
  MODEL_ASSISTANT_HOME,
  MODEL_ASSISTANT_LANGFUSE_SECTION,
} from '../config/backendServices'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
const router = useRouter()

const quickLinks = computed(() => [
  {
    id: 'style-modules',
    label: t('admin.styleModules.linkTitle'),
    description: t('admin.styleModules.linkHint'),
    url: null,
    routeName: 'AdminStyleModules',
    urlDisplay: '/account/backend/style-modules',
  },
  {
    id: 'fashion-ai',
    label: t('account.backend.links.fashionAi'),
    description: t('account.backend.links.fashionAiHint'),
    url: MODEL_ASSISTANT_FASHION_AI,
    urlDisplay: MODEL_ASSISTANT_FASHION_AI,
  },
  {
    id: 'home',
    label: t('account.backend.links.home'),
    description: t('account.backend.links.homeHint'),
    url: MODEL_ASSISTANT_HOME,
    urlDisplay: MODEL_ASSISTANT_HOME,
  },
  {
    id: 'catalog',
    label: t('account.backend.links.catalog'),
    description: t('account.backend.links.catalogHint'),
    url: MODEL_ASSISTANT_CATALOG,
    urlDisplay: MODEL_ASSISTANT_CATALOG,
  },
  {
    id: 'add-model',
    label: t('account.backend.links.addModel'),
    description: t('account.backend.links.addModelHint'),
    url: MODEL_ASSISTANT_ADD_MODEL,
    urlDisplay: MODEL_ASSISTANT_ADD_MODEL,
  },
  {
    id: 'langfuse',
    label: t('account.backend.links.langfuse'),
    description: t('account.backend.links.langfuseHint'),
    url: LANGFUSE_UI_URL,
    urlDisplay: LANGFUSE_UI_URL,
  },
  {
    id: 'langfuse-guide',
    label: t('account.backend.links.langfuseGuide'),
    description: t('account.backend.links.langfuseGuideHint'),
    url: MODEL_ASSISTANT_LANGFUSE_SECTION,
    urlDisplay: MODEL_ASSISTANT_LANGFUSE_SECTION,
  },
])

function openLink(link) {
  if (link?.routeName) {
    router.push({ name: link.routeName })
    return
  }
  if (link?.url) {
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }
}
</script>
