import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestRecovery } from '../services/api'
import AuthCard from '../components/AuthCard'
import Field from '../components/Field'
import SubmitButton from '../components/SubmitButton'
import Alert from '../components/Alert'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await requestRecovery({ email })
      setMessage('Si el correo existe, recibirás instrucciones en tu bandeja de entrada.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo">
      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>
      <form onSubmit={handleSubmit}>
        <Field
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <SubmitButton loading={loading}>Enviar instrucciones</SubmitButton>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </AuthCard>
  )
}
