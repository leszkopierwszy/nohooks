<template>
  <button
    type="button"
    :class="[
      'flex aspect-square w-full max-w-[11.5rem] flex-col justify-between rounded-2xl border p-3 text-left shadow-sm ring-1 ring-inset transition hover:brightness-[0.98] sm:max-w-[12.5rem]',
      theme.border,
      theme.bg,
    ]"
    @click="router.push({ name: 'FinanceSavings' })"
  >
    <div class="flex items-center justify-between gap-2">
      <span :class="['text-[10px] font-semibold uppercase tracking-wide', theme.label]">
        {{ t('overview.savings.label') }}
      </span>
      <span
        class="size-2 shrink-0 rounded-full"
        :class="theme.dot"
        aria-hidden="true"
      />
    </div>
    <div class="min-h-0 flex-1">
      <p :class="['truncate text-xs font-medium', theme.title]">
        {{ savingsTargets.primaryTargetName }}
      </p>
      <p :class="['mt-0.5 text-xl font-bold tracking-tight tabular-nums', theme.percent]">
        {{ savingsTargets.currentSavingsFormatted }}
      </p>
    </div>
    <p :class="['line-clamp-2 text-[10px] leading-snug', theme.muted]">
      {{ percentLabel }}
    </p>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { savingsTargetColorTheme } from '../../constants/savingsTargetColors'
import { useI18n } from '../../composables/useI18n'
import { useNetSalary } from '../../composables/useNetSalary'
import { formatPercentLabel } from '../../utils/savingsTarget'
import { useSavingsTargetsStore } from '../../stores/savingsTargets'
import { useTimelineStore } from '../../stores/timeline'

const { t } = useI18n()
const router = useRouter()
const savingsTargets = useSavingsTargetsStore()
const timelineStore = useTimelineStore()
const { netSalaryPln } = useNetSalary()

const theme = computed(() => savingsTargetColorTheme(savingsTargets.primaryTargetColor))

const m2mPln = computed(() =>
  Math.max(0, netSalaryPln.value - timelineStore.activePlannedExpensesSubtotal),
)

const percentLabel = computed(() => {
  const pct = savingsTargets.percentOfPrimary(m2mPln.value)
  const base = formatPercentLabel(pct, savingsTargets.primaryTargetName)
  const summary = savingsTargets.includedAssetsSummary
  if (!summary) return base
  return `${base} · ${summary}`
})
</script>
