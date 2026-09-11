import { defineStore } from 'pinia'
import { MOCK_FINANCE_ASSETS } from '../constants/mockFinanceAssets'
import {
  formatBalancePln,
  newHistoryId,
  parseBalancePln,
} from '../utils/financeAccountBalance'

const STORAGE_KEY = 'nohooks.financeAccounts.v1'

const EDITABLE_FIELDS = ['name', 'account_number', 'account_name', 'category']

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeAll(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

function seedFromMock() {
  return MOCK_FINANCE_ASSETS.map((row) => ({
    id: row.id,
    name: row.name,
    account_number: row.account_number ?? '',
    account_name: row.account_name ?? '',
    category: row.category ?? 'fiat',
    balance: parseBalancePln(row.balance),
    history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

function normalizeAccount(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null
  return {
    id,
    name: String(raw.name ?? '').trim() || 'Konto',
    account_number: String(raw.account_number ?? ''),
    account_name: String(raw.account_name ?? ''),
    category: String(raw.category ?? 'fiat'),
    balance: parseBalancePln(raw.balance),
    history: Array.isArray(raw.history) ? raw.history : [],
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? new Date().toISOString(),
  }
}

function appendHistory(account, entry) {
  const history = [entry, ...(account.history ?? [])]
  return { ...account, history: history.slice(0, 200), updated_at: new Date().toISOString() }
}

function toFinanceListRow(account) {
  return {
    id: account.id,
    name: account.name,
    account_number: account.account_number,
    account_name: account.account_name,
    category: account.category,
    balance: formatBalancePln(account.balance),
    balance_value: account.balance,
    editable: true,
    history_count: (account.history ?? []).length,
  }
}

export const useFinanceAccountsStore = defineStore('financeAccounts', {
  state: () => ({
    accounts: readAll() ?? seedFromMock(),
  }),

  getters: {
    financeList: (state) => state.accounts.map(toFinanceListRow),

    byId: (state) => (id) => state.accounts.find((a) => Number(a.id) === Number(id)) ?? null,

    totalBalance: (state) => state.accounts.reduce((sum, a) => sum + parseBalancePln(a.balance), 0),
  },

  actions: {
    reload() {
      const stored = readAll()
      this.accounts = stored ?? seedFromMock()
      if (!stored) writeAll(this.accounts)
    },

    persist() {
      writeAll(this.accounts)
    },

    createAccount(payload) {
      const maxId = this.accounts.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0)
      const account = {
        id: maxId + 1,
        name: String(payload.name ?? '').trim() || 'Nowe konto',
        account_number: String(payload.account_number ?? ''),
        account_name: String(payload.account_name ?? ''),
        category: String(payload.category ?? 'fiat'),
        balance: parseBalancePln(payload.balance),
        history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (account.balance !== 0) {
        const entry = {
          id: newHistoryId(),
          kind: 'credit',
          amount: Math.abs(account.balance),
          balance_before: 0,
          balance_after: account.balance,
          note: payload.initial_note ?? null,
          created_at: account.created_at,
        }
        account.history = [entry]
      }
      this.accounts = [...this.accounts, account]
      this.persist()
      return account
    },

    updateAccount(id, patch) {
      const idx = this.accounts.findIndex((a) => Number(a.id) === Number(id))
      if (idx === -1) return null

      let account = { ...this.accounts[idx] }
      const metaChanges = []

      for (const field of EDITABLE_FIELDS) {
        if (patch[field] === undefined) continue
        const next = String(patch[field] ?? '').trim()
        const prev = String(account[field] ?? '')
        if (next !== prev) {
          metaChanges.push({ field, from: prev, to: next })
          account[field] = field === 'category' ? next || 'fiat' : next
        }
      }

      if (metaChanges.length) {
        const entry = {
          id: newHistoryId(),
          kind: 'meta',
          amount: null,
          balance_before: account.balance,
          balance_after: account.balance,
          note: null,
          meta: { changes: metaChanges },
          created_at: new Date().toISOString(),
        }
        account = appendHistory(account, entry)
      }

      this.accounts = [...this.accounts.slice(0, idx), account, ...this.accounts.slice(idx + 1)]
      this.persist()
      return account
    },

    adjustBalance(id, { kind, amount, note }) {
      const idx = this.accounts.findIndex((a) => Number(a.id) === Number(id))
      if (idx === -1) return null

      const delta = Math.abs(parseBalancePln(amount))
      if (delta <= 0) return null

      const account = { ...this.accounts[idx] }
      const balance_before = parseBalancePln(account.balance)
      const signed = kind === 'debit' ? -delta : delta
      const balance_after = Math.round((balance_before + signed) * 100) / 100

      const entry = {
        id: newHistoryId(),
        kind: kind === 'debit' ? 'debit' : 'credit',
        amount: delta,
        balance_before,
        balance_after,
        note: note ? String(note).trim() : null,
        created_at: new Date().toISOString(),
      }

      const next = appendHistory({ ...account, balance: balance_after }, entry)
      this.accounts = [...this.accounts.slice(0, idx), next, ...this.accounts.slice(idx + 1)]
      this.persist()
      return next
    },

    deleteAccount(id) {
      this.accounts = this.accounts.filter((a) => Number(a.id) !== Number(id))
      this.persist()
    },
  },
})
