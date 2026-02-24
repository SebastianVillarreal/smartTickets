import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
import { TicketsPage } from './pages/tickets-page';
import { NewTicketPage } from './pages/new-ticket-page';
import { TicketDetailPage } from './pages/ticket-detail-page';
import { SystemsPage } from './pages/systems-page';
import { UsersPage } from './pages/users-page';
import { useAuth } from './state/auth';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="systems" element={<SystemsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}
