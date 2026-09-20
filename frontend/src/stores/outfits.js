import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

function wearDateKey(outfit) {
  return outfit?.wear_date?.slice?.(0, 10) ?? outfit?.wear_date ?? ''
}

function compareOutfits(a, b) {
  const dateCmp = String(wearDateKey(a)).localeCompare(String(wearDateKey(b)))
  if (dateCmp !== 0) return dateCmp
  return Number(a.id) - Number(b.id)
}

export const useOutfitsStore = defineStore('outfits', {
  state: () => ({
    outfits: [],
    loading: false,
    error: null,
  }),

  getters: {
    outfitsByDate: (state) => {
      const map = {}
      for (const outfit of state.outfits) {
        const key = wearDateKey(outfit)
        if (!key) continue
        if (!map[key]) map[key] = []
        map[key].push(outfit)
      }
      return map
    },
  },

  actions: {
    mergeOutfit(outfit) {
      const index = this.outfits.findIndex((o) => Number(o.id) === Number(outfit.id))
      if (index !== -1) {
        this.outfits[index] = outfit
      } else {
        // Upsert may replace another row with same entity+date under a new id shape — drop conflicts
        const date = wearDateKey(outfit)
        this.outfits = this.outfits.filter(
          (o) =>
            !(
              Number(o.entity_id) === Number(outfit.entity_id) &&
              wearDateKey(o) === date &&
              Number(o.id) !== Number(outfit.id)
            ),
        )
        this.outfits.push(outfit)
      }
      this.outfits.sort(compareOutfits)
    },

    removeOutfitFromState(id) {
      const targetId = Number(id)
      this.outfits = this.outfits.filter((o) => Number(o.id) !== targetId)
    },

    outfitsForDay(dateKey) {
      return this.outfitsByDate[dateKey] ?? []
    },

    forDayAndPrim(dateKey, entityId) {
      return (
        this.outfitsForDay(dateKey).find(
          (o) => Number(o.entity_id) === Number(entityId),
        ) ?? null
      )
    },

    async fetchOutfits({ from, to, entity_id } = {}) {
      this.loading = true
      this.error = null

      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (entity_id != null && entity_id !== '') params.set('entity_id', String(entity_id))
      const query = params.toString()

      try {
        const rows = await apiRequest(`/outfit${query ? `?${query}` : ''}`)
        this.outfits = Array.isArray(rows) ? rows.slice().sort(compareOutfits) : []
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchOutfit(id) {
      this.error = null
      const outfit = await apiRequest(`/outfit/${id}`)
      this.mergeOutfit(outfit)
      return outfit
    },

    async createOutfit(payload) {
      this.error = null
      const outfit = await apiRequest('/outfit', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.mergeOutfit(outfit)
      return outfit
    },

    async updateOutfit(id, payload) {
      this.error = null
      const outfit = await apiRequest(`/outfit/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      this.mergeOutfit(outfit)
      return outfit
    },

    async deleteOutfit(id) {
      this.error = null
      await apiRequest(`/outfit/${id}`, { method: 'DELETE' })
      this.removeOutfitFromState(id)
    },
  },
})

export { wearDateKey }
