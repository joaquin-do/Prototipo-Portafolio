import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import AuthCard from '../components/AuthCard'
import Field from '../components/Field'
import SubmitButton from '../components/SubmitButton'
import Alert from '../components/Alert'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/users/login', form)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Iniciar sesión" subtitle="Accede a tu cuenta">
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit}>
        <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required autoFocus />
        <Field label="Contraseña" type="password" value={form.password} onChange={set('password')} required />
        <SubmitButton loading={loading}>Entrar</SubmitButton>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>
    </AuthCard>
  )
}
