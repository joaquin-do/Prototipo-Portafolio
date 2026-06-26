import { useCallback, useEffect, useState } from 'react'
import { addContact, getContactsByUserId, getUsers } from '@/api'
import { getErrorMessage } from '@/lib/errors'
import {
  Feedback,
  FormCard,
  InputField,
  PageSection,
  PrimaryButton,
  SectionHeader,
  SelectField,
} from '@shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ContactsPage() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState({ contactName: '', contactEmail: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then((response) => setUsers(response.data))
      .catch((requestError) => setError(getErrorMessage(requestError)))
  }, [])

  const loadContacts = useCallback(async (userId) => {
    const response = await getContactsByUserId(userId)
    setContacts(response.data)
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setContacts([])
      return
    }
    loadContacts(selectedUserId).catch((requestError) => {
      setError(getErrorMessage(requestError))
    })
  }, [selectedUserId, loadContacts])

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
      setMessage('Contacto agregado.')
      setForm({ contactName: '', contactEmail: '' })
      await loadContacts(selectedUserId)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <PageSection>
      <SectionHeader title="Contactos" description="Contactos de confianza por usuario" />
      <Feedback type="success">{message}</Feedback>
      <Feedback type="error">{error}</Feedback>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormCard title="Agregar contacto">
          <form className="space-y-4" onSubmit={submit}>
            <SelectField
              label="Usuario"
              id="user"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              required
            >
              <option value="">Seleccionar usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Nombre"
              id="contactName"
              name="contactName"
              value={form.contactName}
              onChange={updateField}
              required
            />
            <InputField
              label="Correo"
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={updateField}
              required
            />
            <PrimaryButton type="submit" disabled={!selectedUserId}>
              Agregar
            </PrimaryButton>
          </form>
        </FormCard>

        <FormCard title="Lista de contactos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.contactName}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.contactEmail}</TableCell>
                </TableRow>
              ))}
              {selectedUserId && contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    Sin contactos
                  </TableCell>
                </TableRow>
              )}
              {!selectedUserId && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    Selecciona un usuario
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </FormCard>
      </div>
    </PageSection>
  )
}
