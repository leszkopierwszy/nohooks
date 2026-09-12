import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'
import { useLotteryTicketsStore } from '../stores/lotteryTickets'
import { useUserAssetsStore } from '../stores/userAssets'
import { useGrowthGoalsStore } from '../stores/growthGoals'
import { useGrowthWellbeingStore } from '../stores/growthWellbeing'
import { useGrowthSleepStore } from '../stores/growthSleep'
import { useGrowthHealthStore } from '../stores/growthHealth'
import { usePersonasStore } from '../stores/personas'

/**
 * Reload client-side stores after switching authenticated user.
 * Safe to call even if some stores are unused yet — Pinia creates them on use.
 */
export function rehydrateUserLocalStores() {
  const stores = [
    useFinanceAccountsStore,
    usePetExpenseAccountsStore,
    useLotteryTicketsStore,
    useUserAssetsStore,
    useGrowthGoalsStore,
    useGrowthWellbeingStore,
    useGrowthSleepStore,
    useGrowthHealthStore,
    usePersonasStore,
  ]

  for (const useStore of stores) {
    try {
      const store = useStore()
      if (typeof store.reload === 'function') store.reload()
      else if (typeof store.rehydrate === 'function') store.rehydrate()
    } catch {
      /* store may not expose reload yet */
    }
  }
}
