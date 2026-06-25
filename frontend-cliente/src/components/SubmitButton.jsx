const base = {
  width: '100%',
  padding: '0.625rem',
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: '0.9375rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background .15s',
  marginTop: '0.25rem',
}

export default function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{ ...base, background: loading ? 'var(--text-muted)' : 'var(--primary)', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? 'Cargando…' : children}
    </button>
  )
}
