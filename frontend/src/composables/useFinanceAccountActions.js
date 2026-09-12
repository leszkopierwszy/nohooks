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

  function updateExpenseEntry(account, entryId, patch) {
    const store = storeFor(account)
    if (!store?.updateExpenseEntry) return null
    return store.updateExpenseEntry(account.id ?? account, entryId, patch)
  }

  function removeExpenseEntry(account, entryId) {
    const store = storeFor(account)
    if (!store?.removeExpenseEntry) return null
    return store.removeExpenseEntry(account.id ?? account, entryId)
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
    updateExpenseEntry,
    removeExpenseEntry,
    createAccount,
    deleteAccount,
    isPetAccount: isPetExpenseAccount,
  }
}
