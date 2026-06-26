import { NavLink, Outlet } from 'react-router-dom'
import { PageContainer } from '@shared'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/contacts', label: 'Contactos' },
  { to: '/requests', label: 'Solicitudes' },
  { to: '/approvals', label: 'Aprobaciones' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b border-border bg-card shadow-sm">
        <PageContainer className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-semibold tracking-tight">Trust Recovery</p>
            <p className="text-xs text-muted-foreground">Panel de administración</p>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </PageContainer>
    </div>
  )
}
