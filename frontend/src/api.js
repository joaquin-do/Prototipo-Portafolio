import axios from 'axios'

function resolveBaseURL() {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api'
  }

  throw new Error(
    'VITE_API_URL no esta configurada. Define la URL del backend de Render en Vercel.',
  )
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
