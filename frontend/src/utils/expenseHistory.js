import { parseBalancePln } from './financeAccountBalance'
import { isoTimestampFromDateKey } from './dateDmY'

function isExpenseEntry(entry) {
  if (!entry) return false
  return entry.kind === 'expense' || entry.meta?.expense === true
}

function normalizeLotteryArrays({
  lottery_numbers,
  lottery_bonus_numbers,
  lottery_bets,
  lottery_system,
  lottery_draw_url,
  lottery_jackpot,
  lottery_track,
}) {
  const lotteryNums = Array.isArray(lottery_numbers)
    ? lottery_numbers.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : []
  const lotteryBonus = Array.isArray(lottery_bonus_numbers)
    ? lottery_bonus_numbers.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : []
  const lotteryBets = Array.isArray(lottery_bets)
    ? lottery_bets
        .map((bet) => ({
          numbers: Array.isArray(bet?.numbers)
            ? bet.numbers.map(Number).filter(Number.isFinite)
            : [],
          bonus_numbers: Array.isArray(bet?.bonus_numbers)
            ? bet.bonus_numbers.map(Number).filter(Number.isFinite)
            : [],
        }))
        .filter((bet) => bet.numbers.length)
    : []
  const lotterySystem = lottery_system ? String(lottery_system).trim() : ''
  const lotteryUrl = lottery_draw_url ? String(lottery_draw_url).trim() : ''
  const lotteryJackpot = lottery_jackpot ? String(lottery_jackpot).trim() : ''

  return {
    lotteryNums,
    lotteryBonus,
    lotteryBets,
    lotterySystem,
    lotteryUrl,
    lotteryJackpot,
    lotteryTrack: Boolean(lottery_track),
  }
}

/** Build meta object for an expense history entry (or undefined if empty). */
export function buildExpenseMeta({
  category,
  purchase_type,
  lottery_numbers,
  lottery_bonus_numbers,
  lottery_bets,
  lottery_system,
  lottery_draw_url,
  lottery_jackpot,
  lottery_track,
}) {
  const cat = category ? String(category).trim() : ''
  const purchaseType = purchase_type ? String(purchase_type).trim() : ''
  const {
    lotteryNums,
    lotteryBonus,
    lotteryBets,
    lotterySystem,
    lotteryUrl,
    lotteryJackpot,
    lotteryTrack,
  } = normalizeLotteryArrays({
    lottery_numbers,
    lottery_bonus_numbers,
    lottery_bets,
    lottery_system,
    lottery_draw_url,
    lottery_jackpot,
    lottery_track,
  })

  if (
    !cat &&
    !purchaseType &&
    !lotteryNums.length &&
    !lotteryBonus.length &&
    !lotteryBets.length &&
    !lotterySystem &&
    !lotteryUrl &&
    !lotteryJackpot &&
    !lotteryTrack
  ) {
    return { expense: true }
  }

  return {
    expense: true,
    ...(cat ? { category: cat } : {}),
    ...(purchaseType ? { purchase_type: purchaseType } : {}),
    ...(lotterySystem ? { lottery_system: lotterySystem } : {}),
    ...(lotteryBets.length ? { lottery_bets: lotteryBets } : {}),
    ...(lotteryNums.length ? { lottery_numbers: lotteryNums } : {}),
    ...(lotteryBonus.length ? { lottery_bonus_numbers: lotteryBonus } : {}),
    ...(lotteryUrl ? { lottery_draw_url: lotteryUrl } : {}),
    ...(lotteryJackpot ? { lottery_jackpot: lotteryJackpot } : {}),
    ...(lotteryTrack ? { lottery_track: true } : {}),
  }
}

/**
 * Update an expense history entry on the same account and adjust balance by amount delta.
 * Returns next account object, or null if not found / invalid.
 */
export function applyExpenseEntryUpdate(account, entryId, patch) {
  if (!account) return null
  const history = [...(account.history ?? [])]
  const idx = history.findIndex((e) => e?.id === entryId)
  if (idx === -1) return null

  const prev = history[idx]
  if (!isExpenseEntry(prev)) return null

  const oldAmount = Math.abs(parseBalancePln(prev.amount))
  const newAmount = Math.abs(parseBalancePln(patch.amount))
  if (newAmount <= 0) return null

  const balance_before = parseBalancePln(prev.balance_before ?? account.balance)
  const balance_after = Math.round((balance_before - newAmount) * 100) / 100
  const accountBalance = Math.round((parseBalancePln(account.balance) + (oldAmount - newAmount)) * 100) / 100

  const meta = buildExpenseMeta(patch)
  const created_at = patch.date
    ? isoTimestampFromDateKey(patch.date)
    : prev.created_at ?? new Date().toISOString()

  const nextEntry = {
    ...prev,
    kind: 'expense',
    amount: newAmount,
    balance_before,
    balance_after,
    note: patch.note ? String(patch.note).trim() : null,
    meta,
    created_at,
  }

  history[idx] = nextEntry
  return {
    ...account,
    balance: accountBalance,
    history,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Remove an expense entry and restore its amount to the account balance.
 */
export function removeExpenseHistoryEntry(account, entryId) {
  if (!account) return null
  const history = [...(account.history ?? [])]
  const idx = history.findIndex((e) => e?.id === entryId)
  if (idx === -1) return null

  const entry = history[idx]
  if (!isExpenseEntry(entry)) return null

  const amount = Math.abs(parseBalancePln(entry.amount))
  history.splice(idx, 1)

  return {
    ...account,
    balance: Math.round((parseBalancePln(account.balance) + amount) * 100) / 100,
    history,
    updated_at: new Date().toISOString(),
  }
}
