import { useLotteryTicketsStore } from '../stores/lotteryTickets'

/** Persist expense adjustment fields plus optional tracked lottery ticket. */
export function saveManualExpense(adjustBalance, payload) {
  if (!payload?.account) return null

  const bets = Array.isArray(payload.lottery_bets) ? payload.lottery_bets : null
  const firstBet = bets?.[0] ?? null

  const result = adjustBalance(payload.account, {
    kind: 'expense',
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
  })

  if (payload.lottery_track && (bets?.length || payload.lottery_numbers?.length)) {
    const lotteryStore = useLotteryTicketsStore()
    lotteryStore.addTicket({
      system: payload.lottery_system,
      bets: bets?.length
        ? bets
        : [
            {
              numbers: payload.lottery_numbers ?? [],
              bonus_numbers: payload.lottery_bonus_numbers ?? [],
            },
          ],
      numbers: payload.lottery_numbers ?? firstBet?.numbers ?? [],
      bonus_numbers: payload.lottery_bonus_numbers ?? firstBet?.bonus_numbers ?? [],
      draw_url: payload.lottery_draw_url,
      jackpot: payload.lottery_jackpot,
      draw_date: payload.date,
      account_id: payload.account.id,
      account_name: payload.account.name,
      amount: payload.amount,
      note: payload.note,
      tracked: true,
    })
  }

  return result
}
