import { cn } from '../lib/cn.js'

export function SectionHeader({ title, description, className }) {
  return (
    <div className={cn('space-y-1', className)}>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
