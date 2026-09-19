import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

export const useFashionStylistStore = defineStore('fashionStylist', {
  state: () => ({
    configured: false,
    statusLoaded: false,
    suggesting: false,
    error: '',
    analysis: null,
    suggestions: [],
    wardrobeNeeds: [],
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

    async suggest({ entity_id, occasion, notes }) {
      this.suggesting = true
      this.error = ''
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
          }),
          timeoutMs: 120000,
        })
        this.analysis = data?.analysis ?? null
        this.suggestions = data?.suggestions ?? []
        this.wardrobeNeeds = data?.wardrobe_needs ?? []
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.suggesting = false
      }
    },

    clearSuggestions() {
      this.analysis = null
      this.suggestions = []
      this.wardrobeNeeds = []
      this.error = ''
    },
  },
})
