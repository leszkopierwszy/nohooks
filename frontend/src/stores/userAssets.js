import { defineStore } from 'pinia'
import { computeAssetValue } from '../utils/portfolioAsset'
import { readUserStorage, writeUserStorage } from '../utils/userScopedStorage'

const STORAGE_KEY = 'nohooks_user_assets_v2'
const LEGACY_STORAGE_KEY = 'nohooks_user_assets_v1'

function todayLocalDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function newId(prefix) {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function normalizeAsset(raw) {
  if (!raw || typeof raw !== 'object') return null
  const tracking_mode = raw.tracking_mode === 'unit_price' ? 'unit_price' : 'manual'
  const quantity = Math.max(0, Number(raw.quantity) || 0) || 1
  const unit_price = Math.max(0, Number(raw.unit_price) || 0)
  const currency = raw.currency === 'EUR' || raw.currency === 'USD' || raw.currency === 'GBP'
    ? raw.currency
    : 'PLN'

  const manualValue = Math.max(0, Number(raw.value) || 0)
  const base = {
    id: raw.id || newId('a'),
    name: String(raw.name || '').trim() || 'Bez nazwy',
    category: String(raw.category || '').trim(),
    tracking_mode,
    price_url: String(raw.price_url || raw.link || '').trim(),
    quantity,
    unit_price,
    currency,
    updated_at: raw.updated_at || null,
    ...(tracking_mode === 'manual' ? { value: manualValue } : {}),
  }

  return {
    ...base,
    value: computeAssetValue(base),
  }
}

function loadParsed() {
  try {
    const raw = readUserStorage(STORAGE_KEY)
    if (!raw) {
      const legacy = readUserStorage(LEGACY_STORAGE_KEY)
      if (legacy) {
        const data = JSON.parse(legacy)
        return {
          assets: (Array.isArray(data.assets) ? data.assets : []).map(normalizeAsset).filter(Boolean),
          snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
        }
      }
      return null
    }
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      assets: (Array.isArray(data.assets) ? data.assets : []).map(normalizeAsset).filter(Boolean),
      snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    }
  } catch {
    return null
  }
}

function saveState(assets, snapshots) {
  try {
    writeUserStorage(STORAGE_KEY, JSON.stringify({ assets, snapshots }))
  } catch {
    /* ignore quota */
  }
}

export const useUserAssetsStore = defineStore('userAssets', {
  state: () => {
    const parsed = loadParsed()
    return {
      assets: parsed?.assets ?? [],
      snapshots: parsed?.snapshots ?? [],
    }
  },

  getters: {
    totalValue(state) {
      return state.assets.reduce((s, a) => s + computeAssetValue(a), 0)
    },

    totalFormatted() {
      return (
        this.totalValue.toLocaleString('pl-PL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' PLN'
      )
    },

    chartPoints(state) {
      return [...state.snapshots]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ date: s.date, value: Number(s.total) || 0 }))
    },
  },

  actions: {
    reload() {
      const parsed = loadParsed()
      this.assets = parsed?.assets ?? []
      this.snapshots = parsed?.snapshots ?? []
    },

    persist() {
      saveState(this.assets, this.snapshots)
    },

    addAsset(payload) {
      const asset = normalizeAsset({
        id: newId('a'),
        name: payload.name,
        value: payload.value,
        category: payload.category,
        tracking_mode: payload.tracking_mode,
        price_url: payload.price_url,
        quantity: payload.quantity,
        unit_price: payload.unit_price,
        currency: payload.currency,
        updated_at: payload.tracking_mode === 'unit_price' ? new Date().toISOString() : null,
      })
      if (!asset) return
      this.assets.push(asset)
      this.persist()
    },

    updateAsset(id, patch) {
      const i = this.assets.findIndex((a) => a.id === id)
      if (i === -1) return
      const cur = this.assets[i]
      const merged = normalizeAsset({
        ...cur,
        ...patch,
        id: cur.id,
        updated_at:
          patch.unit_price != null ||
          patch.quantity != null ||
          patch.tracking_mode != null ||
          patch.value != null
            ? new Date().toISOString()
            : cur.updated_at,
      })
      if (!merged) return
      this.assets[i] = merged
      this.persist()
    },

    removeAsset(id) {
      this.assets = this.assets.filter((a) => a.id !== id)
      this.persist()
    },

    recordSnapshot(dateKey) {
      const date = dateKey || todayLocalDateKey()
      const total = this.totalValue
      const rest = this.snapshots.filter((s) => s.date !== date)
      this.snapshots = [...rest, { id: newId('s'), date, total }].sort((a, b) =>
        a.date.localeCompare(b.date),
      )
      this.persist()
    },
  },
})
