import { defineStore } from 'pinia'
import {
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  updatePasswordRequest,
  updateProfileRequest,
} from '../api/auth'
import { rehydrateUserLocalStores } from '../utils/rehydrateUserLocalStores'
import { setActiveStorageUserId } from '../utils/userScopedStorage'
import { useUserStore } from './user'

const TOKEN_KEY = 'nohooks_auth_token'

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readToken(),
    bootstrapped: false,
    loading: false,
    error: '',
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    getToken() {
      return this.token
    },

    applyWorkspace(user, { claimLegacy = false } = {}) {
      setActiveStorageUserId(user?.id ?? null, { claimLegacy })
      rehydrateUserLocalStores()
    },

    setSession({ token, user }, { claimLegacy = false } = {}) {
      this.token = token || ''
      writeToken(this.token)
      const userStore = useUserStore()
      if (user) {
        userStore.login({ ...user })
        this.applyWorkspace(user, { claimLegacy })
      } else if (!this.token) {
        userStore.logout()
        this.applyWorkspace(null)
      }
    },

    clearSession() {
      this.token = ''
      writeToken('')
      useUserStore().logout()
      this.applyWorkspace(null)
    },

    async bootstrap() {
      if (this.bootstrapped) return
      this.bootstrapped = true
      if (!this.token) {
        useUserStore().logout()
        this.applyWorkspace(null)
        return
      }
      try {
        const data = await meRequest()
        if (data?.user) {
          useUserStore().login({ ...data.user })
          this.applyWorkspace(data.user, { claimLegacy: true })
        } else {
          this.clearSession()
        }
      } catch {
        this.clearSession()
      }
    },

    async login({ email, password }) {
      this.loading = true
      this.error = ''
      try {
        const data = await loginRequest({ email, password })
        this.setSession(data, { claimLegacy: true })
        return data
      } catch (err) {
        this.error = err?.message || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(payload) {
      this.loading = true
      this.error = ''
      try {
        const data = await registerRequest(payload)
        // New account gets a fresh local workspace — do not claim previous user's data.
        this.setSession(data, { claimLegacy: false })
        return data
      } catch (err) {
        this.error = err?.message || 'Registration failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) await logoutRequest()
      } catch {
        /* ignore network errors on logout */
      } finally {
        this.clearSession()
      }
    },

    async updateProfile(payload) {
      const data = await updateProfileRequest(payload)
      if (data?.user) useUserStore().login({ ...data.user })
      return data
    },

    async updatePassword(payload) {
      return updatePasswordRequest(payload)
    },
  },
})
