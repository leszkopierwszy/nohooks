import { defineStore } from 'pinia'
import { SLEEP_STORAGE_VERSION } from '../constants/growthTrackers'
import { computeSleepDurationMinutes } from '../utils/growthSleep'

const STORAGE_KEY = 'nohooks.growthSleep.v1'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (parsed?.version !== SLEEP_STORAGE_VERSION || !Array.isArray(parsed.items)) {
      return []
    }
    return parsed.items
  } catch {
    return []
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SLEEP_STORAGE_VERSION, items }))
}

function newId() {
  return `sl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const quality = raw.quality != null ? Number(raw.quality) : null
  const bed_time = raw.bed_time ? String(raw.bed_time).slice(0, 5) : ''
  const wake_time = raw.wake_time ? String(raw.wake_time).slice(0, 5) : ''
  let duration_minutes =
    raw.duration_minutes != null ? Number(raw.duration_minutes) : computeSleepDurationMinutes(bed_time, wake_time)
  if (duration_minutes != null && (!Number.isFinite(duration_minutes) || duration_minutes < 0)) {
    duration_minutes = null
  }

  return {
    id: String(raw.id || newId()),
    logged_at: raw.logged_at?.slice?.(0, 10) ?? new Date().toISOString().slice(0, 10),
    bed_time,
    wake_time,
    duration_minutes: duration_minutes != null ? Math.round(duration_minutes) : null,
    quality: quality != null && quality >= 1 && quality <= 5 ? quality : null,
    factors: Array.isArray(raw.factors) ? raw.factors.map(String) : [],
    custom_factor: String(raw.custom_factor ?? '').trim(),
    note: String(raw.note ?? '').trim(),
    created_at: raw.created_at ?? new Date().toISOString(),
  }
}

export const useGrowthSleepStore = defineStore('growthSleep', {
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
