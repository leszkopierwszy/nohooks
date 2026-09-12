import { defineStore } from 'pinia'
import { HEALTH_STORAGE_VERSION } from '../constants/growthTrackers'
import { readUserStorage, writeUserStorage } from '../utils/userScopedStorage'

const STORAGE_KEY = 'nohooks.growthHealth.v1'

function readAll() {
  try {
    const raw = readUserStorage(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (parsed?.version !== HEALTH_STORAGE_VERSION || !Array.isArray(parsed.items)) {
      return []
    }
    return parsed.items
  } catch {
    return []
  }
}

function writeAll(items) {
  writeUserStorage(
    STORAGE_KEY,
    JSON.stringify({ version: HEALTH_STORAGE_VERSION, items }),
  )
}

function newId() {
  return `hl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const status = ['healthy', 'sick', 'injury'].includes(raw.status) ? raw.status : 'healthy'
  return {
    id: String(raw.id || newId()),
    logged_at: raw.logged_at?.slice?.(0, 10) ?? raw.logged_at ?? new Date().toISOString().slice(0, 10),
    status,
    detail: String(raw.detail ?? '').trim(),
    note: String(raw.note ?? '').trim(),
    created_at: raw.created_at ?? new Date().toISOString(),
  }
}

export const useGrowthHealthStore = defineStore('growthHealth', {
  state: () => ({
    entries: readAll().map(normalizeEntry).filter(Boolean),
  }),

  getters: {
    sortedEntries: (state) =>
      [...state.entries].sort((a, b) => {
        const d = String(b.logged_at).localeCompare(String(a.logged_at))
        if (d !== 0) return d
        return String(b.created_at).localeCompare(String(a.created_at))
      }),

    latestEntry: (state) => {
      const sorted = [...state.entries].sort((a, b) =>
        String(b.logged_at).localeCompare(String(a.logged_at)),
      )
      return sorted[0] ?? null
    },

    currentStatus: (state) => state.entries[0]?.status ?? null,
  },

  actions: {
    reload() {
      this.entries = readAll().map(normalizeEntry).filter(Boolean)
    },

    persist() {
      writeAll(this.entries)
    },

    addEntry(payload) {
      const entry = normalizeEntry({
        ...payload,
        id: newId(),
        created_at: new Date().toISOString(),
      })
      if (!entry) return null
      this.entries = [entry, ...this.entries]
      this.persist()
      return entry
    },

    updateEntry(id, payload) {
      const idx = this.entries.findIndex((e) => e.id === id)
      if (idx === -1) return null
      const next = normalizeEntry({ ...this.entries[idx], ...payload, id })
      if (!next) return null
      this.entries = [...this.entries.slice(0, idx), next, ...this.entries.slice(idx + 1)]
      this.persist()
      return next
    },

    deleteEntry(id) {
      this.entries = this.entries.filter((e) => e.id !== id)
      this.persist()
    },
  },
})
