import { defineStore } from 'pinia'
import { PET_PURCHASE_TYPES } from '../constants/animalSpecies'
import { translate } from '../i18n'
import {
  formatBalancePln,
  newHistoryId,
  parseBalancePln,
} from '../utils/financeAccountBalance'
import { isoTimestampFromDateKey } from '../utils/dateDmY'

const STORAGE_KEY = 'nohooks.petExpenseAccounts'
const ID_BASE = 10_000

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

function accountIdForEntity(entityId) {
  return ID_BASE + Number(entityId)
}

export function isPetExpenseAccount(account) {
  return account?.category === 'pet_expense' || account?.entity_id != null
}

export const usePetExpenseAccountsStore = defineStore('petExpenseAccounts', {
  state: () => ({
    accounts: readAll(),
  }),

  getters: {
    financeList: (state) =>
      state.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        account_number: a.account_number,
        account_name: a.account_name,
        category: 'pet_expense',
        balance: formatBalancePln(parseBalancePln(a.balance)),
        balance_value: parseBalancePln(a.balance),
        entity_id: a.entity_id,
        species: a.species,
        default_frequency: a.default_frequency,
        purchase_types: a.purchase_types,
        editable: true,
        history_count: (a.history ?? []).length,
      })),

    byEntityId: (state) => (entityId) =>
      state.accounts.find((a) => Number(a.entity_id) === Number(entityId)) ?? null,

    byId: (state) => (id) => state.accounts.find((a) => Number(a.id) === Number(id)) ?? null,
  },

  actions: {
    reload() {
      this.accounts = readAll()
    },

    createForAnimal(entity, { species, defaultFrequency = 'monthly' } = {}) {
      const entityId = Number(entity.id)
      const existing = this.byEntityId(entityId)
      if (existing) return existing

      const account = {
        id: accountIdForEntity(entityId),
        entity_id: entityId,
        name: entity.name,
        account_number: `PET-${entityId}`,
        account_name: `${translate('souls.animals.expenseAccount.title')} — ${entity.name}`,
        balance: 0,
        history: [],
        species: species ?? entity.species ?? null,
        default_frequency: defaultFrequency,
        purchase_types: PET_PURCHASE_TYPES.map((t) => t.value),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      this.accounts = [...this.accounts, account]
      writeAll(this.accounts)
      return account
    },

    syncForAnimal(entity, { species, defaultFrequency } = {}) {
      const entityId = Number(entity.id)
      const idx = this.accounts.findIndex((a) => Number(a.entity_id) === entityId)
      if (idx === -1) {
        return this.createForAnimal(entity, { species, defaultFrequency })
      }

      const prev = this.accounts[idx]
      const next = {
        ...prev,
        name: entity.name,
        species: species ?? entity.species ?? prev.species,
        account_name: `${translate('souls.animals.expenseAccount.title')} — ${entity.name}`,
        default_frequency: defaultFrequency ?? prev.default_frequency,
      }

      this.accounts = [
        ...this.accounts.slice(0, idx),
        next,
        ...this.accounts.slice(idx + 1),
      ]
      writeAll(this.accounts)
      return next
    },

    removeForEntity(entityId) {
      const id = Number(entityId)
      this.accounts = this.accounts.filter((a) => Number(a.entity_id) !== id)
      writeAll(this.accounts)
    },

    updateAccount(id, patch) {
      const idx = this.accounts.findIndex((a) => Number(a.id) === Number(id))
      if (idx === -1) return null

      let account = { ...this.accounts[idx] }
      const metaChanges = []
      const fields = ['name', 'account_number', 'account_name', 'default_frequency']

      for (const field of fields) {
        if (patch[field] === undefined) continue
        const next = String(patch[field] ?? '').trim()
        const prev = String(account[field] ?? '')
        if (next !== prev) {
          metaChanges.push({ field, from: prev, to: next })
          account[field] = next
        }
      }

      if (metaChanges.length) {
        const entry = {
          id: newHistoryId(),
          kind: 'meta',
          amount: null,
          balance_before: parseBalancePln(account.balance),
          balance_after: parseBalancePln(account.balance),
          note: null,
          meta: { changes: metaChanges },
          created_at: new Date().toISOString(),
        }
        account.history = [entry, ...(account.history ?? [])].slice(0, 200)
        account.updated_at = new Date().toISOString()
      }

      this.accounts = [...this.accounts.slice(0, idx), account, ...this.accounts.slice(idx + 1)]
      writeAll(this.accounts)
      return account
    },

    adjustBalance(id, {
      kind,
      amount,
      note,
      category,
      purchase_type,
      date,
      lottery_numbers,
      lottery_bonus_numbers,
      lottery_bets,
      lottery_system,
      lottery_draw_url,
      lottery_jackpot,
      lottery_track,
    }) {
      const idx = this.accounts.findIndex((a) => Number(a.id) === Number(id))
      if (idx === -1) return null

      const delta = Math.abs(parseBalancePln(amount))
      if (delta <= 0) return null

      const isExpense = kind === 'expense'
      const isDebit = kind === 'debit' || isExpense
      const account = { ...this.accounts[idx] }
      const balance_before = parseBalancePln(account.balance)
      const signed = isDebit ? -delta : delta
      const balance_after = Math.round((balance_before + signed) * 100) / 100

      const cat = category ? String(category).trim() : ''
      const purchaseType = purchase_type ? String(purchase_type).trim() : ''
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
      const meta =
        isExpense ||
        cat ||
        purchaseType ||
        lotteryNums.length ||
        lotteryBonus.length ||
        lotteryBets.length ||
        lotterySystem ||
        lotteryUrl ||
        lotteryJackpot
          ? {
              ...(isExpense ? { expense: true } : {}),
              ...(cat ? { category: cat } : {}),
              ...(purchaseType ? { purchase_type: purchaseType } : {}),
              ...(lotterySystem ? { lottery_system: lotterySystem } : {}),
              ...(lotteryBets.length ? { lottery_bets: lotteryBets } : {}),
              ...(lotteryNums.length ? { lottery_numbers: lotteryNums } : {}),
              ...(lotteryBonus.length ? { lottery_bonus_numbers: lotteryBonus } : {}),
              ...(lotteryUrl ? { lottery_draw_url: lotteryUrl } : {}),
              ...(lotteryJackpot ? { lottery_jackpot: lotteryJackpot } : {}),
              ...(lottery_track ? { lottery_track: true } : {}),
            }
          : undefined

      const created_at = date ? isoTimestampFromDateKey(date) : new Date().toISOString()

      const entry = {
        id: newHistoryId(),
        kind: isExpense ? 'expense' : isDebit ? 'debit' : 'credit',
        amount: delta,
        balance_before,
        balance_after,
        note: note ? String(note).trim() : null,
        ...(meta ? { meta } : {}),
        created_at,
      }

      account.balance = balance_after
      account.history = [entry, ...(account.history ?? [])].slice(0, 200)
      account.updated_at = new Date().toISOString()

      this.accounts = [...this.accounts.slice(0, idx), account, ...this.accounts.slice(idx + 1)]
      writeAll(this.accounts)
      return account
    },
  },
})
