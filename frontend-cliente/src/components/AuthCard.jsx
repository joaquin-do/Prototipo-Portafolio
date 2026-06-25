const styles = {
  wrapper: {
    width: '100%',
    maxWidth: 400,
    padding: '2rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
  },
}

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>{title}</h1>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      {children}
    </div>
  )
}
