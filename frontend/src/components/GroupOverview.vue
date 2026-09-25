<template>
  <FinanceCloseLink />

  <div class="mb-6 flex items-baseline justify-between border-b border-gray-200 pb-6">
    <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ title }}</h1>
  </div>

  <div v-if="showSalary">
    <TableGroups />
  </div>
  <div v-else-if="showPlannedExpenses">
    <TableBadge />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FinanceCloseLink from './finance/FinanceCloseLink.vue'
import TableGroups from './TableGroups.vue'
import TableBadge from './TableBadge.vue'

const route = useRoute()

const title = computed(() => String(route.query?.n ?? ''))

const showSalary = computed(() => title.value.toLowerCase() === 'salary')
const showPlannedExpenses = computed(() => title.value.toLowerCase() === 'planned expenses')
</script>
