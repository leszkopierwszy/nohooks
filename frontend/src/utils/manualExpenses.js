import { useFinanceAccountsStore } from '../stores/financeAccounts'
import { usePetExpenseAccountsStore } from '../stores/petExpenseAccounts'
import { expenseCategoryDisplayLabel } from '../stores/expenseCategories'
import { formatBalancePln, parseBalancePln } from './financeAccountBalance'
import { formatIsoToDmY, toIsoDateKey } from './dateDmY'
import { translate } from '../i18n'

function isExpenseEntry(entry) {
  if (!entry) return false
  return entry.kind === 'expense' || entry.meta?.expense === true
}

function mapExpenseRow(account, entry) {
  const amount = Math.abs(parseBalancePln(entry.amount))
  const created = entry.created_at ? String(entry.created_at) : ''
  const dateKey = created.slice(0, 10)
  return {
    id: `${account.id}:${entry.id}`,
    entry_id: entry.id,
    account_id: account.id,
    account_name: account.name,
    amount,
    amount_formatted: formatBalancePln(amount),
    note: entry.note ?? null,
    category: entry.meta?.category ?? null,
    category_label: expenseCategoryDisplayLabel(entry.meta?.category),
    lottery_system: entry.meta?.lottery_system ?? null,
    lottery_bets: entry.meta?.lottery_bets ?? null,
    lottery_numbers: entry.meta?.lottery_numbers ?? null,
    lottery_bonus_numbers: entry.meta?.lottery_bonus_numbers ?? null,
    lottery_jackpot: entry.meta?.lottery_jackpot ?? null,
    lottery_draw_url: entry.meta?.lottery_draw_url ?? null,
    lottery_track: Boolean(entry.meta?.lottery_track),
    purchase_type: entry.meta?.purchase_type ?? null,
    created_at: created,
    date_key: dateKey,
    date_label: dateKey ? formatIsoToDmY(dateKey) : '—',
  }
}

/** All manual expense entries across finance + pet accounts, newest first. */
export function collectManualExpenses() {
  const finance = useFinanceAccountsStore()
  const pet = usePetExpenseAccountsStore()
  const accounts = [...finance.accounts, ...pet.accounts]
  const rows = []

  for (const account of accounts) {
    for (const entry of account.history ?? []) {
      if (!isExpenseEntry(entry)) continue
      rows.push(mapExpenseRow(account, entry))
    }
  }

  rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  return rows
}

export function manualExpensesSummary(rows = collectManualExpenses()) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const monthKey = toIsoDateKey().slice(0, 7)
  const monthRows = rows.filter((row) => row.date_key.startsWith(monthKey))
  const monthTotal = monthRows.reduce((sum, row) => sum + row.amount, 0)

  return {
    count: rows.length,
    total,
    total_formatted: formatBalancePln(total),
    month_count: monthRows.length,
    month_total: monthTotal,
    month_total_formatted: formatBalancePln(monthTotal),
    count_label:
      rows.length === 0
        ? translate('finance.expenses.countEmpty')
        : translate('finance.expenses.count', { n: rows.length }),
  }
}
