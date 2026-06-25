import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

export const register = (data) => api.post('/users/register', data)

export const requestRecovery = (data) => api.post('/recovery/request', data)

export default api
