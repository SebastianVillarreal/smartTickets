import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, Td, Th } from '@/components/ui/table';
import type { User } from '@/lib/types';
import { useAuth } from '@/state/auth';

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: 'Admin123!', role: 'REPORTER' });

  const load = () => api.users.list().then(setUsers);
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, [user?.role]);

  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Gestión de usuarios y roles.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nuevo usuario</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></div>
          <div><Label>Password</Label><Input value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} /></div>
          <div><Label>Rol</Label><Select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>{['ADMIN','MANAGER','DEVELOPER','REPORTER'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
          <div className="md:col-span-4">
            <Button onClick={async () => { await api.users.create(form); setForm({ name:'', email:'', password:'Admin123!', role:'REPORTER' }); load(); }}>Crear usuario</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <thead><tr><Th>Nombre</Th><Th>Email</Th><Th>Rol</Th><Th>Creado</Th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.role}</Td>
                  <Td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
