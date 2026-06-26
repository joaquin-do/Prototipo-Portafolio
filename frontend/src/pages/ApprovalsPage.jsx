import { useCallback, useState } from 'react'
import { approveRecovery, getRecoveryRequests, rejectRecovery } from '@/api'
import { getErrorMessage } from '@/lib/errors'
import { usePolling } from '@/hooks/usePolling'
import StatusBadge from '@/components/StatusBadge'
import { Feedback, FormCard, PageSection, PrimaryButton, SectionHeader } from '@shared'

export default function ApprovalsPage() {
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await getRecoveryRequests()
      setRequests(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }, [])

  usePolling(load)

  async function decide(recoveryRequestId, contactEmail, action) {
    setMessage('')
    setError('')

    try {
      const payload = { recoveryRequestId, contactEmail }
      const response =
        action === 'approve'
          ? await approveRecovery(payload)
          : await rejectRecovery(payload)
      setMessage(`Solicitud #${response.data.id}: ${response.data.status}.`)
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function decisionFor(request, contactEmail) {
    return request.approvals.find((approval) => approval.contactEmail === contactEmail)?.decision
  }

  return (
    <PageSection>
      <SectionHeader title="Aprobaciones" description="Decisiones de contactos de confianza" />
      <Feedback type="success">{message}</Feedback>
      <Feedback type="error">{error}</Feedback>

      <div className="space-y-4">
        {requests.map((request) => (
          <FormCard
            key={request.id}
            title={`Solicitud #${request.id}`}
            description={`${request.userName} — ${request.userEmail}`}
            contentClassName="space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Expira: {new Date(request.expiresAt).toLocaleString()}
              </p>
              <StatusBadge status={request.status} />
            </div>

            <div className="space-y-3">
              {request.contacts.map((contact) => {
                const decision = decisionFor(request, contact.contactEmail)
                const expired = request.status === 'EXPIRED'

                return (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{contact.contactName}</p>
                      <p className="text-xs text-muted-foreground">{contact.contactEmail}</p>
                      {decision ? (
                        <p className="mt-1 text-xs text-muted-foreground">Decisión: {decision}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <PrimaryButton
                        type="button"
                        size="sm"
                        disabled={expired}
                        onClick={() => decide(request.id, contact.contactEmail, 'approve')}
                      >
                        Aprobar
                      </PrimaryButton>
                      <PrimaryButton
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={expired}
                        onClick={() => decide(request.id, contact.contactEmail, 'reject')}
                      >
                        Rechazar
                      </PrimaryButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </FormCard>
        ))}

        {requests.length === 0 && (
          <FormCard contentClassName="py-10 text-center text-sm text-muted-foreground">
            Sin solicitudes pendientes
          </FormCard>
        )}
      </div>
    </PageSection>
  )
}
