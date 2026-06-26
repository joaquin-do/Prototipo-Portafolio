import { cn } from '../lib/cn.js'

export function FormCard({ title, description, children, footer, className, contentClassName }) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {(title || description) && (
        <header className="space-y-1 border-b border-border px-6 py-4">
          {title ? <h2 className="text-base font-semibold leading-none">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </header>
      )}
      <div className={cn('px-6 py-5', contentClassName)}>{children}</div>
      {footer ? <footer className="border-t border-border px-6 py-4">{footer}</footer> : null}
    </article>
  )
}
