import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    stats: {
      followers: 0,
      following: 0,
      collections: 0,
    },
  }),

  getters: {
    fullProfile: (state) => ({
      ...state.user,
      ...state.stats,
    }),

    isCreator: (state) => state.user?.role === 'creator',
  },

  actions: {
    login(userData) {
      this.user = userData
      this.isAuthenticated = true
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    },

    updateAvatar(url) {
      if (!this.user) return
      this.user.avatar = url
    },

    updateProfile(patch) {
      if (!this.user) return
      Object.assign(this.user, patch)
    },

    incrementFollowers() {
      this.stats.followers++
    },
  },
})
