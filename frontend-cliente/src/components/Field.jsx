const styles = {
  group: { display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' },
  label: { fontSize: '0.875rem', fontWeight: 500 },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color .15s',
    width: '100%',
  },
  error: { fontSize: '0.8125rem', color: 'var(--danger)' },
}

export default function Field({ label, error, ...props }) {
  return (
    <div style={styles.group}>
      {label && <label style={styles.label}>{label}</label>}
      <input
        style={{
          ...styles.input,
          borderColor: error ? 'var(--danger)' : 'var(--border)',
        }}
        {...props}
      />
      {error && <span style={styles.error}>{error}</span>}
    </div>
  )
}
