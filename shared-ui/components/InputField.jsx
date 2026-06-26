import { cn } from '../lib/cn.js'

const inputClassName =
  'flex h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

export function InputField({ label, id, error, hint, className, inputClassName: customInput, ...props }) {
  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
      ) : null}
      <input
        id={fieldId}
        className={cn(inputClassName, error && 'border-destructive', customInput)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function SelectField({ label, id, error, children, className, ...props }) {
  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
      ) : null}
      <select id={fieldId} className={cn(inputClassName, error && 'border-destructive')} {...props}>
        {children}
      </select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
