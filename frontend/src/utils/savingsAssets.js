import { parseMockAssetBalance } from '../constants/mockFinanceAssets'
import { computeAssetValue } from './portfolioAsset'
import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'

/** Prefiks id konta (mock lista) w `included_asset_ids`. */
export const SAVINGS_ACCOUNT_ID_PREFIX = 'account:'

export function accountSavingsId(mockAccountId) {
  return `${SAVINGS_ACCOUNT_ID_PREFIX}${mockAccountId}`
}

export function isAccountSavingsId(id) {
  return String(id).startsWith(SAVINGS_ACCOUNT_ID_PREFIX)
}

export function parseAccountSavingsId(id) {
  const n = Number(String(id).slice(SAVINGS_ACCOUNT_ID_PREFIX.length))
  return Number.isFinite(n) ? n : null
}

export function mockFinanceAssetsTotal() {
  return mockFinanceAccounts().reduce(
    (sum, a) => sum + parseMockAssetBalance(a.balance),
    0,
  )
}

export function mockFinanceAccounts() {
  const finance = useFinanceAccountsStore()
  const pet = usePetExpenseAccountsStore()
  return [...finance.financeList, ...pet.financeList]
}

export function allSelectableIds(portfolioAssets = [], accounts = mockFinanceAccounts()) {
  return [
    ...portfolioAssets.map((a) => a.id),
    ...accounts.map((a) => accountSavingsId(a.id)),
  ]
}

/**
 * null = wszystkie pozycje (aktywa + konta).
 * [] = żadna; inaczej jawna lista id.
 */
export function resolveIncludedIds(selectableIds, storedIds) {
  if (storedIds === null) return [...selectableIds]
  if (!Array.isArray(storedIds)) return []
  const allowed = new Set(selectableIds)
  return storedIds.filter((id) => allowed.has(String(id)))
}

export function resolveTargetIncludedIds(target, portfolioAssets, accounts = mockFinanceAccounts()) {
  return resolveIncludedIds(allSelectableIds(portfolioAssets, accounts), target?.included_asset_ids ?? null)
}

export function sumIncludedPortfolio(assets, includedIds) {
  const set = new Set(includedIds)
  return assets.filter((a) => set.has(a.id)).reduce((s, a) => s + computeAssetValue(a), 0)
}

export function sumIncludedAccounts(accounts, includedIds) {
  const set = new Set(includedIds)
  return accounts
    .filter((a) => set.has(accountSavingsId(a.id)))
    .reduce((s, a) => s + parseMockAssetBalance(a.balance), 0)
}

export function sumIncludedSelection(portfolioAssets, accounts, includedIds) {
  return sumIncludedPortfolio(portfolioAssets, includedIds) + sumIncludedAccounts(accounts, includedIds)
}

export function sumTargetIncludedSelection(portfolioAssets, target, accounts = mockFinanceAccounts()) {
  const includedIds = resolveTargetIncludedIds(target, portfolioAssets, accounts)
  return sumIncludedSelection(portfolioAssets, accounts, includedIds)
}

/** @deprecated użyj sumIncludedSelection */
export function sumIncludedAssets(assets, includedIds) {
  return sumIncludedPortfolio(assets, includedIds)
}

/** @deprecated */
export function resolveIncludedAssetIds(portfolioIds, storedIds) {
  return resolveIncludedIds(portfolioIds, storedIds)
}

/** @deprecated */
export function sumTargetIncludedAssets(assets, target) {
  return sumTargetIncludedSelection(assets, target)
}

export function includedSelectionSummary(target, portfolioAssets, accounts = mockFinanceAccounts()) {
  const selectable = allSelectableIds(portfolioAssets, accounts)
  const total = selectable.length
  const includedIds = resolveIncludedIds(selectable, target?.included_asset_ids ?? null)

  if (total === 0) return 'Brak aktywów i kont'

  const portfolioIdSet = new Set(portfolioAssets.map((a) => a.id))
  let assetsN = 0
  let accountsN = 0
  for (const id of includedIds) {
    if (portfolioIdSet.has(id)) assetsN += 1
    else if (isAccountSavingsId(id)) accountsN += 1
  }

  if (target?.included_asset_ids === null || target?.included_asset_ids === undefined) {
    return `${portfolioAssets.length} aktywów, ${accounts.length} kont — wszystkie`
  }

  if (includedIds.length === 0) return 'Nic nie wliczone'

  const parts = []
  if (assetsN) parts.push(`${assetsN} ${assetsN === 1 ? 'aktywum' : 'aktywów'}`)
  if (accountsN) parts.push(`${accountsN} ${accountsN === 1 ? 'konto' : 'kont'}`)
  const detail = parts.length ? parts.join(', ') : `${includedIds.length} pozycji`
  return `${detail} z ${total} wliczonych`
}

/** @deprecated */
export function includedAssetsSummaryForTarget(target, portfolioCount) {
  return includedSelectionSummary(target, { length: portfolioCount }, [])
}

export function formatSavingsTotal(value) {
  return (
    value.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' PLN'
  )
}

export function formatAccountBalance(account) {
  const v = parseMockAssetBalance(account.balance)
  return (
    v.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' PLN'
  )
}
