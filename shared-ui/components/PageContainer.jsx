import { cn } from '../lib/cn.js'

const widths = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
}

export function PageContainer({ children, width = 'xl', className }) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widths[width], className)}>{children}</div>
  )
}

export function PageSection({ children, className }) {
  return <section className={cn('space-y-6', className)}>{children}</section>
}

export function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

export function DashboardShell({ header, children, width = 'md' }) {
  return (
    <div className="min-h-screen bg-muted/50">
      {header}
      <PageContainer width={width} className="py-6">
        <PageSection>{children}</PageSection>
      </PageContainer>
    </div>
  )
}
