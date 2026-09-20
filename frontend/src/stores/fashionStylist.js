import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

export const useFashionStylistStore = defineStore('fashionStylist', {
  state: () => ({
    configured: false,
    statusLoaded: false,
    suggesting: false,
    analyzingBase: false,
    error: '',
    analysis: null,
    suggestions: [],
    wardrobeNeeds: [],
    warning: '',
    baseWardrobe: null,
  }),

  actions: {
    async fetchStatus() {
      try {
        const data = await apiRequest('/fashion-stylist/status')
        this.configured = Boolean(data?.configured)
        this.statusLoaded = true
        return this.configured
      } catch (err) {
        this.configured = false
        this.statusLoaded = true
        throw err
      }
    },

    async suggest({ entity_id, occasion, notes, anchor_item_id }) {
      this.suggesting = true
      this.error = ''
      this.warning = ''
      this.analysis = null
      this.suggestions = []
      this.wardrobeNeeds = []
      try {
        const data = await apiRequest('/fashion-stylist/suggest', {
          method: 'POST',
          body: JSON.stringify({
            entity_id: Number(entity_id),
            occasion: occasion || null,
            notes: notes?.trim() || null,
            anchor_item_id: anchor_item_id ? Number(anchor_item_id) : null,
          }),
          timeoutMs: 120000,
        })
        this.analysis = data?.analysis ?? null
        this.suggestions = data?.suggestions ?? []
        this.wardrobeNeeds = data?.wardrobe_needs ?? []
        this.warning = data?.warning ? String(data.warning) : ''
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.suggesting = false
      }
    },

    async fetchBaseWardrobe({ entity_id, occasion, season, style } = {}) {
      this.analyzingBase = true
      this.error = ''
      try {
        const data = await apiRequest('/fashion-stylist/base-wardrobe', {
          method: 'POST',
          body: JSON.stringify({
            entity_id: Number(entity_id),
            occasion: occasion || null,
            season: season || null,
            style: style || null,
          }),
        })
        this.baseWardrobe = data
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.analyzingBase = false
      }
    },

    clearSuggestions() {
      this.analysis = null
      this.suggestions = []
      this.wardrobeNeeds = []
      this.warning = ''
      this.error = ''
    },
  },
})
