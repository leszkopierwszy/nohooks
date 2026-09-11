<template>
  <OverviewBentoCard :title="t('overview.finance.title')" :subtitle="t('overview.finance.subtitle')">
    <template #actions>
      <router-link
        :to="{ name: 'Finance' }"
        class="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        {{ t('overview.finance.open') }} →
      </router-link>
    </template>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="tile in flowTiles"
        :key="tile.key"
        type="button"
        class="flex min-h-[5.5rem] flex-col justify-between rounded-xl bg-gray-50/90 px-3 py-3 text-left ring-1 ring-inset ring-gray-200/80 transition hover:bg-white hover:ring-gray-300"
        @click="go(tile.route)"
      >
        <span class="text-[11px] font-medium text-gray-500">{{ tile.name }}</span>
        <span class="mt-1 text-lg font-semibold tracking-tight text-gray-900">{{ tile.value }}</span>
        <span
          :class="[
            'mt-1 line-clamp-2 text-[10px] leading-snug',
            tile.accentClass ?? 'text-gray-500',
          ]"
        >
          <span
            v-if="tile.dotClass"
            class="mr-1 inline-block size-1.5 rounded-full align-middle"
            :class="tile.dotClass"
            aria-hidden="true"
          />
          {{ tile.hint }}
        </span>
      </button>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        v-for="tile in assetTiles"
        :key="tile.key"
        type="button"
        class="flex min-h-[4.5rem] flex-col justify-between rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-gray-300 hover:bg-gray-50/80"
        @click="go(tile.route)"
      >
        <span class="text-[11px] font-medium text-gray-500">{{ tile.name }}</span>
        <span class="text-base font-semibold text-gray-900">{{ tile.value }}</span>
        <span class="text-[10px] text-gray-400">{{ tile.hint }}</span>
      </button>
    </div>
  </OverviewBentoCard>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import { useFinanceOverviewStats } from '../../composables/useFinanceOverviewStats'
import OverviewBentoCard from './OverviewBentoCard.vue'

const { t } = useI18n()
const router = useRouter()
const { flowTiles, assetTiles } = useFinanceOverviewStats()

function go(route) {
  if (route) router.push(route)
}
</script>
