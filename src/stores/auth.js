import { defineStore } from 'pinia'
import { apiGet, apiPost } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('farmpro_token') || '',
    role: localStorage.getItem('farmpro_role') || '',
    user: null,
    loading: false,
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    async init() {
      if (!this.token) {
        this.initialized = true
        return
      }
      try {
        this.user = await apiGet('/api/auth/me')
        this.role = this.user?.role || ''
        if (this.role) localStorage.setItem('farmpro_role', this.role)
      } catch {
        this.logout()
      } finally {
        this.initialized = true
      }
    },
    async login(payload) {
      this.loading = true
      try {
        const res = await apiPost('/api/auth/login', payload)
        this.token = res.token
        this.user = res.user
        this.role = res.user?.role || ''
        localStorage.setItem('farmpro_token', res.token)
        if (this.role) localStorage.setItem('farmpro_role', this.role)
      } finally {
        this.loading = false
      }
    },
    async register(payload) {
      this.loading = true
      try {
        const res = await apiPost('/api/auth/register', payload)
        this.token = res.token
        this.user = res.user
        this.role = res.user?.role || ''
        localStorage.setItem('farmpro_token', res.token)
        if (this.role) localStorage.setItem('farmpro_role', this.role)
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.token = ''
      this.role = ''
      this.user = null
      localStorage.removeItem('farmpro_token')
      localStorage.removeItem('farmpro_role')
    }
  }
})
