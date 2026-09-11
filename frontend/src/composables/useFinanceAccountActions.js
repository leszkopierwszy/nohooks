import { isPetExpenseAccount } from '../stores/petExpenseAccounts'
import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'

export function useFinanceAccountActions() {
  const financeStore = useFinanceAccountsStore()
  const petStore = usePetExpenseAccountsStore()

  function storeFor(account) {
    if (!account) return null
    if (isPetExpenseAccount(account) || Number(account.id) >= 10_000) return petStore
    return financeStore
  }

  function getAccount(id) {
    return financeStore.byId(id) ?? petStore.byId(id)
  }

  function getHistory(account) {
    const raw = getAccount(account?.id ?? account)
    return raw?.history ?? []
  }

  function updateAccount(account, patch) {
    const store = storeFor(account)
    if (!store?.updateAccount) return null
    return store.updateAccount(account.id, patch)
  }

  function adjustBalance(account, payload) {
    const store = storeFor(account)
    if (!store?.adjustBalance) return null
    return store.adjustBalance(account.id, payload)
  }

  function createAccount(payload) {
    return financeStore.createAccount(payload)
  }

  function deleteAccount(account) {
    if (isPetExpenseAccount(account)) return false
    financeStore.deleteAccount(account.id)
    return true
  }

  return {
    financeStore,
    petStore,
    getAccount,
    getHistory,
    updateAccount,
    adjustBalance,
    createAccount,
    deleteAccount,
    isPetAccount: isPetExpenseAccount,
  }
}
