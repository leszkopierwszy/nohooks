import { defineStore } from 'pinia'
import { newHistoryId } from '../utils/financeAccountBalance'
import { readUserStorage, writeUserStorage } from '../utils/userScopedStorage'

const STORAGE_KEY = 'nohooks.lotteryTickets.v1'

function readAll() {
  try {
    const raw = readUserStorage(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(tickets) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(tickets))
}

function normalizeTicket(raw) {
  if (!raw || typeof raw !== 'object') return null
  const bets = Array.isArray(raw.bets)
    ? raw.bets
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
  const numbers = Array.isArray(raw.numbers)
    ? raw.numbers.map(Number).filter(Number.isFinite)
    : (bets[0]?.numbers ?? [])
  const bonus_numbers = Array.isArray(raw.bonus_numbers)
    ? raw.bonus_numbers.map(Number).filter(Number.isFinite)
    : (bets[0]?.bonus_numbers ?? [])

  return {
    id: raw.id ?? newHistoryId(),
    system: raw.system ?? null,
    bets: bets.length ? bets : numbers.length ? [{ numbers, bonus_numbers }] : [],
    numbers,
    bonus_numbers,
    draw_url: raw.draw_url ? String(raw.draw_url).trim() : null,
    jackpot: raw.jackpot ? String(raw.jackpot).trim() : null,
    draw_date: raw.draw_date ? String(raw.draw_date).trim() : null,
    account_id: raw.account_id ?? null,
    account_name: raw.account_name ?? null,
    amount: raw.amount ?? null,
    tracked: raw.tracked !== false,
    note: raw.note ? String(raw.note).trim() : null,
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? new Date().toISOString(),
  }
}

export const useLotteryTicketsStore = defineStore('lotteryTickets', {
  state: () => ({
    tickets: readAll().map(normalizeTicket).filter(Boolean),
  }),

  getters: {
    trackedTickets: (state) =>
      state.tickets
        .filter((t) => t.tracked)
        .slice()
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),

    trackedCount: (state) => state.tickets.filter((t) => t.tracked).length,
  },

  actions: {
    reload() {
      this.tickets = readAll().map(normalizeTicket).filter(Boolean)
    },

    persist() {
      writeAll(this.tickets)
    },

    addTicket(payload) {
      const ticket = normalizeTicket({
        ...payload,
        id: newHistoryId(),
        tracked: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (!ticket) return null
      this.tickets = [ticket, ...this.tickets].slice(0, 200)
      this.persist()
      return ticket
    },

    untrack(id) {
      const idx = this.tickets.findIndex((t) => t.id === id)
      if (idx === -1) return false
      const next = { ...this.tickets[idx], tracked: false, updated_at: new Date().toISOString() }
      this.tickets = [...this.tickets.slice(0, idx), next, ...this.tickets.slice(idx + 1)]
      this.persist()
      return true
    },

    removeTicket(id) {
      this.tickets = this.tickets.filter((t) => t.id !== id)
      this.persist()
    },
  },
})
