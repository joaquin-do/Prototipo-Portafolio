import axios from 'axios'

export const ENDPOINTS = {
  users: {
    register: '/users/register',
  },
  recovery: {
    request: '/recovery/request',
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
        throw new Error('VITE_API_URL debe terminar en /api (ej: https://tu-api.onrender.com/api).')
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
  headers: { 'Content-Type': 'application/json' },
})

export const register = (data) => api.post(ENDPOINTS.users.register, data)

export const requestRecovery = (data) => api.post(ENDPOINTS.recovery.request, data)

export default api
