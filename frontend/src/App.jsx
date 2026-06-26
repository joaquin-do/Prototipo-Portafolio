import { Route, Routes } from 'react-router-dom'
import AdminLayout from '@/components/AdminLayout'
import ApprovalsPage from '@/pages/ApprovalsPage'
import ContactsPage from '@/pages/ContactsPage'
import DashboardPage from '@/pages/DashboardPage'
import RequestsPage from '@/pages/RequestsPage'

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
      </Route>
    </Routes>
  )
}

export default App
