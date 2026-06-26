import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, requestRecovery, getRecoveryRequests } from '@/services/api'
import { getErrorMessage, activeRequestForUser, formatTimeRemaining } from '@/lib/recovery'
import { useAuth } from '@/hooks/useAuth'
import { usePolling } from '@/hooks/usePolling'
import StatusBadge from '@/components/StatusBadge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  AuthShell,
  Feedback,
  FormCard,
  InputField,
  PrimaryButton,
} from '@shared'

export default function Home() {
  const navigate = useNavigate()
  const { login: setSession } = useAuth()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotRequest, setForgotRequest] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadForgotStatus = useCallback(async () => {
    if (!forgotEmail) return
    try {
      const response = await getRecoveryRequests()
      const active = activeRequestForUser(response.data, forgotEmail)
      setForgotRequest(active ?? null)
    } catch {
      // silent on polling
    }
  }, [forgotEmail])

  usePolling(loadForgotStatus, 5000, forgotOpen && Boolean(forgotEmail))

  useEffect(() => {
    if (forgotOpen && forgotEmail) {
      loadForgotStatus()
    }
  }, [forgotOpen, forgotEmail, loadForgotStatus])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoading(true)
    try {
      const response = await login(loginForm)
      setSession(response.data)
      navigate('/dashboard')
    } catch (error) {
      setLoginError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setRegisterError('')
    setRegisterSuccess('')
    setLoading(true)
    try {
      const response = await register(registerForm)
      setRegisterSuccess('Cuenta creada. Inicia sesión para continuar.')
      setLoginForm({ email: response.data.email, password: '' })
      setRegisterForm({ name: '', email: '', password: '' })
      setRegisterOpen(false)
    } catch (error) {
      setRegisterError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(event) {
    event.preventDefault()
    setForgotError('')
    setForgotMessage('')
    setLoading(true)
    try {
      const response = await requestRecovery({ email: forgotEmail })
      setForgotMessage('Solicitud enviada')
      setForgotRequest(response.data)
    } catch (error) {
      setForgotError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <FormCard
        title="Iniciar sesión"
        description="Accede a tu cuenta para gestionar la recuperación"
        contentClassName="space-y-4"
      >
        <Feedback type="success">{registerSuccess}</Feedback>
        <Feedback type="error">{loginError}</Feedback>

        <form className="space-y-4" onSubmit={handleLogin}>
          <InputField
            label="Correo"
            id="login-email"
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            required
          />
          <InputField
            label="Contraseña"
            id="login-password"
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />
          <PrimaryButton type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </PrimaryButton>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setForgotOpen((open) => !open)
              setRegisterOpen(false)
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {forgotOpen && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
            <Feedback type="error">{forgotError}</Feedback>
            <Feedback type="success">{forgotMessage}</Feedback>
            <form className="space-y-4" onSubmit={handleForgot}>
              <InputField
                label="Correo"
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <PrimaryButton type="submit" variant="outline" fullWidth loading={loading}>
                Solicitar recuperación
              </PrimaryButton>
            </form>
            {forgotRequest && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <StatusBadge status={forgotRequest.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiempo restante</span>
                  <span className="font-medium">{formatTimeRemaining(forgotRequest.expiresAt)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        <Collapsible open={registerOpen} onOpenChange={setRegisterOpen}>
          <CollapsibleTrigger asChild>
            <PrimaryButton
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setForgotOpen(false)}
            >
              Crear cuenta
            </PrimaryButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <Feedback type="error">{registerError}</Feedback>
            <form className="space-y-4" onSubmit={handleRegister}>
              <InputField
                label="Nombre"
                id="register-name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
              />
              <InputField
                label="Correo"
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
              <InputField
                label="Contraseña"
                id="register-password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
              <PrimaryButton type="submit" fullWidth loading={loading}>
                Crear cuenta
              </PrimaryButton>
            </form>
          </CollapsibleContent>
        </Collapsible>
      </FormCard>
    </AuthShell>
  )
}
