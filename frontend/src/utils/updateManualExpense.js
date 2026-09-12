import { saveManualExpense } from './saveManualExpense'

function expensePatchFromPayload(payload) {
  const bets = Array.isArray(payload.lottery_bets) ? payload.lottery_bets : null
  const firstBet = bets?.[0] ?? null
  return {
    amount: payload.amount,
    note: payload.note,
    category: payload.category,
    purchase_type: payload.purchase_type,
    date: payload.date,
    lottery_numbers: payload.lottery_numbers ?? firstBet?.numbers ?? null,
    lottery_bonus_numbers: payload.lottery_bonus_numbers ?? firstBet?.bonus_numbers ?? null,
    lottery_bets: bets,
    lottery_system: payload.lottery_system,
    lottery_draw_url: payload.lottery_draw_url,
    lottery_jackpot: payload.lottery_jackpot,
    lottery_track: payload.lottery_track,
  }
}

/**
 * Update an existing expense. If the account changes, remove from the old account
 * and create a new expense on the target account.
 */
export function updateManualExpense(
  { updateExpenseEntry, removeExpenseEntry, adjustBalance, getAccount },
  payload,
) {
  if (!payload?.entry_id || payload.from_account_id == null || !payload?.account) return null

  const patch = expensePatchFromPayload(payload)
  const fromId = Number(payload.from_account_id)
  const toId = Number(payload.account.id)

  if (fromId === toId) {
    const fromAccount = getAccount?.(fromId) ?? payload.account
    return updateExpenseEntry(fromAccount, payload.entry_id, patch)
  }

  const fromAccount = getAccount?.(fromId) ?? { id: fromId }
  const removed = removeExpenseEntry(fromAccount, payload.entry_id)
  if (!removed) return null

  return saveManualExpense(adjustBalance, {
    ...payload,
    ...patch,
    lottery_track: false,
  })
}
