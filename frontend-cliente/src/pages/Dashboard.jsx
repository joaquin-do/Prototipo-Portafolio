import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard'

export default function Dashboard() {
  return (
    <AuthCard title="Panel de usuario" subtitle="Cuenta creada correctamente">
      <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        Bienvenido. Este es un panel de demostración tras el registro.
      </p>
      <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>
    </AuthCard>
  )
}
