import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addContact,
  getContactsByUserId,
  getRecoveryRequests,
  requestRecovery,
  resetPassword,
} from '@/services/api'
import {
  approvalCount,
  contactDecision,
  formatTimeRemaining,
  getErrorMessage,
  activeRequestForUser,
} from '@/lib/recovery'
import { useAuth } from '@/hooks/useAuth'
import { usePolling } from '@/hooks/usePolling'
import StatusBadge from '@/components/StatusBadge'
import {
  DashboardShell,
  Feedback,
  FormCard,
  InputField,
  ListRow,
  PageContainer,
  PrimaryButton,
} from '@shared'

function DecisionIcon({ decision }) {
  if (decision === 'APPROVED') return <span className="text-sm font-medium text-emerald-700">✔ Aprobado</span>
  if (decision === 'REJECTED') return <span className="text-sm font-medium text-red-700">✖ Rechazado</span>
  return <span className="text-sm text-muted-foreground">○ Pendiente</span>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [contacts, setContacts] = useState([])
  const [activeRequest, setActiveRequest] = useState(null)
  const [contactForm, setContactForm] = useState({ contactName: '', contactEmail: '' })
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return

    try {
      const [contactsResponse, requestsResponse] = await Promise.all([
        getContactsByUserId(user.id),
        getRecoveryRequests(),
      ])
      setContacts(contactsResponse.data)
      setActiveRequest(activeRequestForUser(requestsResponse.data, user.email))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }, [user])

  usePolling(load, 5000, Boolean(user))

  async function handleAddContact(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      await addContact({
        userId: user.id,
        contactName: contactForm.contactName,
        contactEmail: contactForm.contactEmail,
      })
      setContactForm({ contactName: '', contactEmail: '' })
      setMessage('Contacto agregado.')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleRequestRecovery() {
    setMessage('')
    setError('')

    try {
      const response = await requestRecovery({ email: user.email })
      setActiveRequest(response.data)
      setMessage('Solicitud de recuperación creada.')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      await resetPassword({
        recoveryRequestId: activeRequest.id,
        newPassword: passwordForm.newPassword,
      })
      setMessage('Contraseña actualizada correctamente.')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const approvals = approvalCount(activeRequest)
  const canResetPassword = activeRequest?.status === 'APPROVED' && approvals >= 2

  const header = (
    <header className="border-b border-border bg-card shadow-sm">
      <PageContainer width="md" className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <PrimaryButton type="button" variant="outline" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </PrimaryButton>
      </PageContainer>
    </header>
  )

  return (
    <DashboardShell header={header} width="md">
      <Feedback type="success">{message}</Feedback>
      <Feedback type="error">{error}</Feedback>

      <FormCard title="Contactos de confianza" contentClassName="space-y-4">
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ListRow
              key={contact.id}
              title={contact.contactName}
              subtitle={contact.contactEmail}
            />
          ))}
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay contactos registrados.</p>
          )}
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddContact}>
          <InputField
            label="Nombre"
            id="contactName"
            value={contactForm.contactName}
            onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })}
            required
          />
          <InputField
            label="Correo"
            id="contactEmail"
            type="email"
            value={contactForm.contactEmail}
            onChange={(e) => setContactForm({ ...contactForm, contactEmail: e.target.value })}
            required
          />
          <PrimaryButton type="submit" className="sm:col-span-2">
            Agregar contacto
          </PrimaryButton>
        </form>
      </FormCard>

      <FormCard title="Recuperación de cuenta" contentClassName="space-y-4">
        {!activeRequest && (
          <PrimaryButton type="button" onClick={handleRequestRecovery}>
            Solicitar recuperación
          </PrimaryButton>
        )}

        {activeRequest && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <StatusBadge status={activeRequest.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tiempo restante</span>
              <span className="font-medium">{formatTimeRemaining(activeRequest.expiresAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aprobaciones</span>
              <span className="font-medium">{approvals} / 2</span>
            </div>
          </div>
        )}
      </FormCard>

      {activeRequest && (
        <FormCard title="Estado de aprobaciones" contentClassName="space-y-2">
          {(activeRequest.contacts ?? contacts).map((contact) => (
            <ListRow
              key={contact.id ?? contact.contactEmail}
              title={contact.contactName}
              subtitle={contact.contactEmail}
              action={<DecisionIcon decision={contactDecision(activeRequest, contact.contactEmail)} />}
            />
          ))}
        </FormCard>
      )}

      {canResetPassword && (
        <FormCard title="Tu solicitud fue aprobada" contentClassName="space-y-4">
          {!showPasswordForm ? (
            <PrimaryButton type="button" onClick={() => setShowPasswordForm(true)}>
              Cambiar contraseña
            </PrimaryButton>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <InputField
                label="Nueva contraseña"
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <InputField
                label="Confirmar contraseña"
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
              />
              <PrimaryButton type="submit">Guardar</PrimaryButton>
            </form>
          )}
        </FormCard>
      )}
    </DashboardShell>
  )
}
