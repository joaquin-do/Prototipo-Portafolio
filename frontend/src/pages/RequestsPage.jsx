import { useCallback, useState } from 'react'
import { getRecoveryRequests, requestRecovery } from '@/api'
import { getErrorMessage } from '@/lib/errors'
import { usePolling } from '@/hooks/usePolling'
import StatusBadge from '@/components/StatusBadge'
import {
  Feedback,
  FormCard,
  InputField,
  PageSection,
  PrimaryButton,
  SectionHeader,
} from '@shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function approvalCount(request) {
  return request.approvals?.filter((a) => a.decision === 'APPROVED').length ?? 0
}

export default function RequestsPage() {
  const [email, setEmail] = useState('')
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

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await requestRecovery({ email })
      setMessage(`Solicitud #${response.data.id} creada.`)
      setEmail('')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <PageSection>
      <SectionHeader title="Solicitudes" description="Recuperación de cuentas" />
      <Feedback type="success">{message}</Feedback>
      <Feedback type="error">{error}</Feedback>

      <FormCard title="Nueva solicitud">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={submit}>
          <InputField
            label="Correo del usuario"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1"
            required
          />
          <PrimaryButton type="submit" className="sm:mb-0 sm:w-auto">
            Solicitar recuperación
          </PrimaryButton>
        </form>
      </FormCard>

      <FormCard title="Todas las solicitudes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Aprobaciones</TableHead>
              <TableHead>Expira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>#{request.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{request.userName}</div>
                  <div className="text-xs text-muted-foreground">{request.userEmail}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell>{approvalCount(request)} / 2</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(request.expiresAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Sin solicitudes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </FormCard>
    </PageSection>
  )
}
