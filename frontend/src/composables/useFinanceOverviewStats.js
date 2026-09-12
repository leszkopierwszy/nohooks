import { computed } from 'vue'
import { useNetSalary } from './useNetSalary'
import { mockFinanceAccounts, mockFinanceAssetsTotal } from '../utils/savingsAssets'
import { savingsTargetColorTheme } from '../constants/savingsTargetColors'
import { formatPercentLabel } from '../utils/savingsTarget'
import { useSavingsTargetsStore } from '../stores/savingsTargets'
import { useTimelineStore } from '../stores/timeline'
import { useUserAssetsStore } from '../stores/userAssets'

/** Kafelki finansowe na Overview i stronie Finance. */
export function useFinanceOverviewStats() {
  const timelineStore = useTimelineStore()
  const userAssets = useUserAssetsStore()
  const savingsTargets = useSavingsTargetsStore()
  const { netSalaryPln, netSalaryFormatted } = useNetSalary()

  const plannedExpensesFormatted = computed(
    () =>
      timelineStore.activePlannedExpensesSubtotal.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' PLN / mies.',
  )

  const m2mTargetPln = computed(() =>
    Math.max(0, netSalaryPln.value - timelineStore.activePlannedExpensesSubtotal),
  )

  const m2mFormatted = computed(
    () =>
      m2mTargetPln.value.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' PLN',
  )

  const savingsTargetPercentLabel = computed(() => {
    const pct = savingsTargets.percentOfPrimary(m2mTargetPln.value)
    const summary = savingsTargets.includedAssetsSummary
    const base = formatPercentLabel(pct, savingsTargets.primaryTargetName)
    if (userAssets.assets.length === 0) return base
    return `${base} · ${summary}`
  })

  const flowTiles = computed(() => [
    {
      key: 'salary',
      name: 'Salary',
      value: netSalaryFormatted.value,
      hint: 'Net Salary (FTE)',
      route: { name: 'Finance' },
    },
    {
      key: 'planned',
      name: 'Planned Expenses',
      value: plannedExpensesFormatted.value,
      hint: 'Aktywne subskrypcje',
      route: { name: 'Finance' },
    },
    {
      key: 'm2m',
      name: 'M2M Expected Savings',
      value: m2mFormatted.value,
      hint: 'Wynagrodzenie − subskrypcje',
      route: { name: 'Finance' },
    },
    {
      key: 'savings',
      name: 'Savings (current)',
      value: savingsTargets.currentSavingsFormatted,
      hint: savingsTargetPercentLabel.value,
      accentClass: savingsTargetColorTheme(savingsTargets.primaryTargetColor).accent,
      dotClass: savingsTargetColorTheme(savingsTargets.primaryTargetColor).dot,
      route: { name: 'FinanceSavings' },
    },
  ])

  const assetTiles = computed(() => [
    {
      key: 'portfolio',
      name: 'Moje aktywa',
      value: userAssets.totalFormatted,
      hint:
        userAssets.assets.length === 0
          ? 'Brak pozycji'
          : `${userAssets.assets.length} w portfelu`,
      route: { name: 'FinancePortfolio' },
    },
    {
      key: 'mock',
      name: 'Lista kont',
      value:
        mockFinanceAssetsTotal().toLocaleString('pl-PL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' PLN',
      hint: `${mockFinanceAccounts().length} kont`,
      route: { name: 'FinanceMockAssets' },
    },
  ])

  return { flowTiles, assetTiles }
}
