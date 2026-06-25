const styles = {
  base: {
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius)',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
}

export default function Alert({ type = 'error', children }) {
  if (!children) return null
  return <div style={{ ...styles.base, ...styles[type] }}>{children}</div>
}
