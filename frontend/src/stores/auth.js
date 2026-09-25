import { defineStore } from 'pinia'
import {
  deleteAvatarRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  updatePasswordRequest,
  updateProfileRequest,
  uploadAvatarRequest,
} from '../api/auth'
import { rehydrateUserLocalStores } from '../utils/rehydrateUserLocalStores'
import {
  setActiveStorageUserId,
  setWorkspaceApiSyncEnabled,
} from '../utils/userScopedStorage'
import { syncWorkspaceWithApi } from '../utils/workspaceSync'
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

    async applyWorkspace(user) {
      const isLegacyOwner = Boolean(user?.isLegacyOwner)
      setWorkspaceApiSyncEnabled(false)
      setActiveStorageUserId(user?.id ?? null, { claimLegacy: isLegacyOwner })
      if (user?.id && this.token) {
        await syncWorkspaceWithApi({ isLegacyOwner })
        setWorkspaceApiSyncEnabled(true)
      }
      rehydrateUserLocalStores()
    },

    async setSession({ token, user }) {
      this.token = token || ''
      writeToken(this.token)
      const userStore = useUserStore()
      if (user) {
        userStore.login({ ...user })
        await this.applyWorkspace(user)
      } else if (!this.token) {
        userStore.logout()
        await this.applyWorkspace(null)
      }
    },

    async clearSession() {
      this.token = ''
      writeToken('')
      useUserStore().logout()
      await this.applyWorkspace(null)
    },

    async bootstrap() {
      if (this.bootstrapped) return
      this.bootstrapped = true
      if (!this.token) {
        useUserStore().logout()
        await this.applyWorkspace(null)
        return
      }
      try {
        const data = await meRequest()
        if (data?.user) {
          useUserStore().login({ ...data.user })
          await this.applyWorkspace(data.user)
        } else {
          await this.clearSession()
        }
      } catch {
        await this.clearSession()
      }
    },

    async login({ email, password }) {
      this.loading = true
      this.error = ''
      try {
        const data = await loginRequest({ email, password })
        await this.setSession(data)
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
        if (data?.token) {
          await this.setSession(data)
        }
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
        await this.clearSession()
      }
    },

    async updateProfile(payload) {
      const data = await updateProfileRequest(payload)
      if (data?.user) useUserStore().login({ ...data.user })
      return data
    },

    async uploadAvatar(file) {
      const data = await uploadAvatarRequest(file)
      if (data?.user) useUserStore().login({ ...data.user })
      return data
    },

    async deleteAvatar() {
      const data = await deleteAvatarRequest()
      if (data?.user) useUserStore().login({ ...data.user })
      return data
    },

    async updatePassword(payload) {
      return updatePasswordRequest(payload)
    },
  },
})
