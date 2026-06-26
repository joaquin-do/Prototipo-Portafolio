import { cn } from '../lib/cn.js'

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-border bg-card text-foreground',
}

export function Feedback({ type = 'info', children, className }) {
  if (!children) return null

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-4 py-3 text-sm', styles[type], className)}
    >
      {children}
    </div>
  )
}

export function ListRow({ title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        {title ? <p className="truncate text-sm font-medium text-foreground">{title}</p> : null}
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
