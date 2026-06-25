import { NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  addContact,
  approveRecovery,
  getContactsByUserId,
  getDashboardStats,
  getRecoveryRequests,
  getUsers,
  registerUser,
  rejectRecovery,
  requestRecovery,
  resetPassword,
} from './api'
import './App.css'

function getErrorMessage(error) {
  return error.response?.data?.message || 'Ocurrio un error inesperado.'
}

function Notice({ type = 'success', children }) {
  if (!children) {
    return null
  }

  return <p className={`notice ${type}`}>{children}</p>
}

function StatusBadge({ status }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          getDashboardStats(),
          getUsers(),
        ])
        setStats(statsResponse.data)
        setUsers(usersResponse.data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      }
    }

    loadDashboard()
  }, [])

  return (
    <section className="page">
      <div className="page-title">
        <p className="eyebrow">MVP academico</p>
        <h1>Sistema de Recuperacion de Cuenta mediante Contactos de Confianza</h1>
        <p>
          Demuestra que una cuenta solo puede recuperarse cuando al menos dos
          contactos de confianza aprueban la solicitud.
        </p>
      </div>

      <Notice type="error">{error}</Notice>

      {stats && (
        <div className="metrics">
          <article>
            <span>{stats.users}</span>
            <p>Usuarios registrados</p>
          </article>
          <article>
            <span>{stats.contacts}</span>
            <p>Contactos registrados</p>
          </article>
          <article>
            <span>{stats.activeRequests}</span>
            <p>Solicitudes activas</p>
          </article>
          <article>
            <span>{stats.approvedRequests}</span>
            <p>Solicitudes aprobadas</p>
          </article>
          <article>
            <span>{stats.expiredRequests}</span>
            <p>Solicitudes expiradas</p>
          </article>
        </div>
      )}

      <div className="card">
        <h2>Usuarios de prueba</h2>
        <p className="hint">
          Usa ana@example.com para el caso de 2 aprobaciones, luis@example.com
          para 1 aprobacion y sofia@example.com para el caso sin contactos.
        </p>
        <div className="list">
          {users.map((user) => (
            <div className="list-row" key={user.id}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RegisterUser() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await registerUser(form)
      setMessage(`Cuenta creada para ${response.data.email}.`)
      setForm({ name: '', email: '', password: '' })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="page narrow">
      <h1>Registro de usuario</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Nombre
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Correo
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Contrasena
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            required
          />
        </label>
        <button type="submit">Crear cuenta</button>
      </form>
      <Notice>{message}</Notice>
      <Notice type="error">{error}</Notice>
    </section>
  )
}

function TrustedContacts() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState({ contactName: '', contactEmail: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers().then((response) => setUsers(response.data)).catch((requestError) => {
      setError(getErrorMessage(requestError))
    })
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setContacts([])
      return
    }

    loadContacts(selectedUserId)
  }, [selectedUserId])

  async function loadContacts(userId) {
    const response = await getContactsByUserId(userId)
    setContacts(response.data)
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      await addContact({
        userId: selectedUserId,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
      })
      setMessage('Contacto agregado correctamente.')
      setForm({ contactName: '', contactEmail: '' })
      await loadContacts(selectedUserId)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="page">
      <h1>Contactos de confianza</h1>
      <div className="grid two">
        <form className="card form" onSubmit={submit}>
          <label>
            Usuario
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              required
            >
              <option value="">Seleccionar usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre del contacto
            <input
              name="contactName"
              value={form.contactName}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Correo del contacto
            <input
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={updateField}
              required
            />
          </label>
          <button type="submit" disabled={!selectedUserId}>
            Agregar
          </button>
        </form>

        <div className="card">
          <h2>Contactos registrados</h2>
          <p className="hint">
            Se requieren minimo 3 contactos para solicitar una recuperacion.
            Contactos actuales: {contacts.length}.
          </p>
          <div className="list">
            {contacts.map((contact) => (
              <div className="list-row" key={contact.id}>
                <strong>{contact.contactName}</strong>
                <span>{contact.contactEmail}</span>
              </div>
            ))}
            {selectedUserId && contacts.length === 0 && <p>No hay contactos registrados.</p>}
          </div>
        </div>
      </div>
      <Notice>{message}</Notice>
      <Notice type="error">{error}</Notice>
    </section>
  )
}

function RecoveryRequest() {
  const [email, setEmail] = useState('')
  const [createdRequest, setCreatedRequest] = useState(null)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setCreatedRequest(null)
    setError('')

    try {
      const response = await requestRecovery({ email })
      setCreatedRequest(response.data)
      setEmail('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="page narrow">
      <h1>Solicitar recuperacion</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Correo del usuario
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit">Recuperar cuenta</button>
      </form>

      {createdRequest && (
        <div className="card">
          <h2>Solicitud creada</h2>
          <p>Solicitud #{createdRequest.id}</p>
          <p>Estado: <StatusBadge status={createdRequest.status} /></p>
          <p>Expira: {new Date(createdRequest.expiresAt).toLocaleString()}</p>
          <p className="hint">{createdRequest.message}</p>
        </div>
      )}

      <Notice type="error">{error}</Notice>
    </section>
  )
}

function Approvals() {
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      const response = await getRecoveryRequests()
      setRequests(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function decide(recoveryRequestId, contactEmail, action) {
    setMessage('')
    setError('')

    try {
      const payload = { recoveryRequestId, contactEmail }
      const response =
        action === 'approve'
          ? await approveRecovery(payload)
          : await rejectRecovery(payload)
      setMessage(`Solicitud #${response.data.id}: ${response.data.status}.`)
      await loadRequests()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function decisionFor(request, contactEmail) {
    return request.approvals.find((approval) => approval.contactEmail === contactEmail)?.decision
  }

  return (
    <section className="page">
      <h1>Simulacion de aprobacion</h1>
      <p className="hint">
        Cada boton simula la decision de un contacto. No se envian correos reales.
      </p>
      <Notice>{message}</Notice>
      <Notice type="error">{error}</Notice>

      <div className="request-list">
        {requests.map((request) => (
          <article className="card request-card" key={request.id}>
            <div className="request-header">
              <div>
                <h2>Solicitud #{request.id}</h2>
                <p>{request.userName} - {request.userEmail}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="hint">Expira: {new Date(request.expiresAt).toLocaleString()}</p>

            <div className="contact-actions">
              {request.contacts.map((contact) => {
                const decision = decisionFor(request, contact.contactEmail)

                return (
                  <div className="approval-row" key={contact.id}>
                    <div>
                      <strong>{contact.contactName}</strong>
                      <span>{contact.contactEmail}</span>
                      {decision && <small>Decision actual: {decision}</small>}
                    </div>
                    <div className="button-group">
                      <button
                        type="button"
                        disabled={request.status === 'EXPIRED'}
                        onClick={() => decide(request.id, contact.contactEmail, 'approve')}
                      >
                        Aprobar
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        disabled={request.status === 'EXPIRED'}
                        onClick={() => decide(request.id, contact.contactEmail, 'reject')}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ResetPassword() {
  const [requests, setRequests] = useState([])
  const [recoveryRequestId, setRecoveryRequestId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getRecoveryRequests().then((response) => {
      setRequests(response.data.filter((request) => request.status === 'APPROVED'))
    }).catch((requestError) => {
      setError(getErrorMessage(requestError))
    })
  }, [])

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await resetPassword({
        recoveryRequestId,
        newPassword,
      })
      setMessage(response.data.message)
      setNewPassword('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="page narrow">
      <h1>Restablecer contrasena</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Solicitud aprobada
          <select
            value={recoveryRequestId}
            onChange={(event) => setRecoveryRequestId(event.target.value)}
            required
          >
            <option value="">Seleccionar solicitud</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                #{request.id} - {request.userEmail}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nueva contrasena
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit">Cambiar contrasena</button>
      </form>
      <Notice>{message}</Notice>
      <Notice type="error">{error}</Notice>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <strong>Trust Recovery Prototype</strong>
          <span>Recuperacion distribuida</span>
        </div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/register">Registro</NavLink>
          <NavLink to="/contacts">Contactos</NavLink>
          <NavLink to="/recovery">Recuperar</NavLink>
          <NavLink to="/approvals">Aprobaciones</NavLink>
          <NavLink to="/reset-password">Restablecer</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/contacts" element={<TrustedContacts />} />
          <Route path="/recovery" element={<RecoveryRequest />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
