import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api'
import AuthCard from '../components/AuthCard'
import Field from '../components/Field'
import SubmitButton from '../components/SubmitButton'
import Alert from '../components/Alert'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (!form.email.includes('@')) e.email = 'Correo inválido'
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setServerError('')
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Crear cuenta" subtitle="Regístrate gratis">
      <Alert>{serverError}</Alert>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre" type="text" value={form.name} onChange={set('name')} error={errors.name} required autoFocus />
        <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
        <Field label="Contraseña" type="password" value={form.password} onChange={set('password')} error={errors.password} required />
        <Field label="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} required />
        <SubmitButton loading={loading}>Registrarme</SubmitButton>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthCard>
  )
}
