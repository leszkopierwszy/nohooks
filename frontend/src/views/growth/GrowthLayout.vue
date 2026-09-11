<template>
  <div class="mx-auto max-w-6xl">
    <header class="border-b border-gray-200/80 pb-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {{ t('nav.growth') }}
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-gray-500">{{ sectionSubtitle }}</p>
        </div>
        <slot name="actions" />
      </div>
    </header>

    <GrowthSubNav />

    <div class="mt-8">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GrowthSubNav from '../../components/growth/GrowthSubNav.vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()
const route = useRoute()

const sectionSubtitle = computed(() => {
  if (route.name === 'GrowthWellbeing') return t('growth.wellbeing.subtitle')
  if (route.name === 'GrowthSleep') return t('growth.sleep.subtitle')
  if (route.name === 'GrowthHealth') return t('growth.health.subtitle')
  return t('growth.subtitle')
})
</script>
