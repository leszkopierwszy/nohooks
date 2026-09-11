<template>
  <nav class="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3" :aria-label="t('growth.nav.label')">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="rounded-full px-3 py-1.5 text-sm font-medium transition"
      :class="
        isActive(item)
          ? 'bg-gray-900 text-white'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
      "
    >
      {{ t(item.labelKey) }}
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()
const route = useRoute()

const items = [
  { labelKey: 'growth.nav.goals', to: { name: 'GrowthGoals' } },
  { labelKey: 'growth.nav.wellbeing', to: { name: 'GrowthWellbeing' } },
  { labelKey: 'growth.nav.sleep', to: { name: 'GrowthSleep' } },
  { labelKey: 'growth.nav.medical', to: { name: 'GrowthHealth' } },
]

function isActive(item) {
  if (item.to.name === 'GrowthGoals') {
    return route.name === 'GrowthGoals' || route.name === 'Growth'
  }
  return route.name === item.to.name
}
</script>
