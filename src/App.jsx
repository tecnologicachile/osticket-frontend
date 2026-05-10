import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './stores/auth.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import TicketDetailPage from './pages/TicketDetailPage.jsx'
import TopicsPage from './pages/TopicsPage.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/topics" element={<TopicsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tickets?queue=my" replace />} />
    </Routes>
  )
}
