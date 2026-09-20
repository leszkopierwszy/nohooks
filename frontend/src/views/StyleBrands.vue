<template>
  <div>
    <header class="pb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ t('style.brands.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ t('style.brands.subtitle') }}
      </p>
    </header>

    <FashionPreferredStores />
  </div>
</template>

<script setup>
import FashionPreferredStores from '../components/style/FashionPreferredStores.vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>
