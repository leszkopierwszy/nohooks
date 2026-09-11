// src/stores/user.js

import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {
      id: 1,
      username: 'bartosz',
      displayName: 'Bartosz',
      email: 'bartosz@example.com',
      avatar: '/mock/avatar.jpg',
      role: 'creator',
      bio: 'Building pxlstg.'
    },

    isAuthenticated: true,

    stats: {
      followers: 120,
      following: 45,
      collections: 12
    }
  }),

  getters: {
    fullProfile: (state) => ({
      ...state.user,
      ...state.stats
    }),

    isCreator: (state) => state.user.role === 'creator'
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
    }
  }
})