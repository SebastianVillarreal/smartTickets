import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, Td, Th } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { SystemItem } from '@/lib/types';
import { useAuth } from '@/state/auth';

export function SystemsPage() {
  const { user } = useAuth();
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [form, setForm] = useState({ key: '', name: '', description: '', ownerTeam: '' });

  const load = () => api.systems.list().then(setSystems);
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sistemas</h1>
        <p className="text-sm text-muted-foreground">Catálogo de productos/proyectos.</p>
      </div>

      {user?.role === 'ADMIN' && (
        <Card>
          <CardHeader><CardTitle>Nuevo sistema</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div><Label>Key</Label><Input value={form.key} onChange={(e) => setForm((s) => ({ ...s, key: e.target.value.toUpperCase() }))} /></div>
            <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
            <div><Label>Equipo owner</Label><Input value={form.ownerTeam} onChange={(e) => setForm((s) => ({ ...s, ownerTeam: e.target.value }))} /></div>
            <div className="md:col-span-4"><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></div>
            <div className="md:col-span-4">
              <Button onClick={async () => { await api.systems.create(form); setForm({ key:'', name:'', description:'', ownerTeam:'' }); load(); }}>Guardar sistema</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <thead><tr><Th>Key</Th><Th>Nombre</Th><Th>Owner</Th><Th>Descripción</Th><Th>Tickets</Th></tr></thead>
            <tbody>
              {systems.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <Td className="font-semibold">{s.key}</Td>
                  <Td>{s.name}</Td>
                  <Td>{s.ownerTeam}</Td>
                  <Td>{s.description}</Td>
                  <Td>{s._count?.tickets ?? 0}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
