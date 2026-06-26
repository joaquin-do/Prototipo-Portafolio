import { useCallback, useState } from 'react'
import { getDashboardStats, getUsers } from '@/api'
import { getErrorMessage } from '@/lib/errors'
import { usePolling } from '@/hooks/usePolling'
import { Feedback, FormCard, PageSection, SectionHeader } from '@shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        getDashboardStats(),
        getUsers(),
      ])
      setStats(statsResponse.data)
      setUsers(usersResponse.data)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }, [])

  usePolling(load)

  const metrics = stats
    ? [
        { label: 'Usuarios', value: stats.users },
        { label: 'Contactos', value: stats.contacts },
        { label: 'Activas', value: stats.activeRequests },
        { label: 'Aprobadas', value: stats.approvedRequests },
        { label: 'Expiradas', value: stats.expiredRequests },
      ]
    : []

  return (
    <PageSection>
      <SectionHeader title="Resumen" description="Estado general del sistema" />
      <Feedback type="error">{error}</Feedback>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <FormCard key={metric.label} title={metric.label} contentClassName="pt-4">
            <p className="text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
          </FormCard>
        ))}
      </div>

      <FormCard title="Usuarios">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Sin usuarios registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </FormCard>
    </PageSection>
  )
}
