import { Bell, Bug, ClipboardList, LayoutDashboard, LogOut, PlusSquare, ServerCog, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/state/auth';
import { Button } from './ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets', label: 'Tickets', icon: ClipboardList },
  { to: '/tickets/new', label: 'Nuevo Ticket', icon: PlusSquare },
  { to: '/systems', label: 'Sistemas', icon: ServerCog },
  { to: '/users', label: 'Usuarios', icon: Users, adminOnly: true },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-white/80 backdrop-blur md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">smartTickets</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <Bug className="h-5 w-5 text-primary" />
              Control Center
            </div>
          </div>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <nav className="grid gap-1 px-3 pb-4">
          {navItems
            .filter((item) => !(item.adminOnly && user?.role !== 'ADMIN'))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-secondary',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <div className="mt-1 text-xs">{user?.role}</div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </aside>
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
