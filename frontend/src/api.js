import axios from 'axios'

export const ENDPOINTS = {
  users: {
    register: '/users/register',
    login: '/users/login',
    list: '/users',
  },
  contacts: {
    base: '/contacts',
    byUser: (userId) => `/contacts/${userId}`,
  },
  recovery: {
    request: '/recovery/request',
    list: '/recovery',
    approve: '/recovery/approve',
    reject: '/recovery/reject',
    resetPassword: '/recovery/reset-password',
    dashboard: '/recovery/dashboard',
  },
}

function resolveBaseURL() {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    const base = configured.replace(/\/$/, '')

    if (!import.meta.env.DEV) {
      if (/localhost|127\.0\.0\.1/i.test(base)) {
        throw new Error('VITE_API_URL no puede usar localhost en produccion.')
      }
      if (!base.endsWith('/api')) {
        throw new Error('VITE_API_URL debe terminar en /api (ej: https://trust-recovery-api.onrender.com/api).')
      }
    }

    return base
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api'
  }

  throw new Error(
    'VITE_API_URL no esta configurada. Debe incluir /api (ej: https://trust-recovery-api.onrender.com/api).',
  )
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

export const registerUser = (data) => api.post(ENDPOINTS.users.register, data)
export const getUsers = () => api.get(ENDPOINTS.users.list)
export const addContact = (data) => api.post(ENDPOINTS.contacts.base, data)
export const getContactsByUserId = (userId) => api.get(ENDPOINTS.contacts.byUser(userId))
export const requestRecovery = (data) => api.post(ENDPOINTS.recovery.request, data)
export const getRecoveryRequests = () => api.get(ENDPOINTS.recovery.list)
export const approveRecovery = (data) => api.post(ENDPOINTS.recovery.approve, data)
export const rejectRecovery = (data) => api.post(ENDPOINTS.recovery.reject, data)
export const resetPassword = (data) => api.post(ENDPOINTS.recovery.resetPassword, data)
export const getDashboardStats = () => api.get(ENDPOINTS.recovery.dashboard)

export default api
