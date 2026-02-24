import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, Td, Th } from '@/components/ui/table';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/common';
import { formatDate } from '@/lib/utils';
import type { SystemItem, Ticket, User } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function TicketsPage() {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rows, setRows] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'BUG' | 'FEATURE'>('BUG');
  const [filters, setFilters] = useState<Record<string, string>>({
    systemId: '',
    status: '',
    priority: '',
    assignedToUserId: '',
    from: '',
    to: '',
    q: '',
  });

  const load = async () => {
    const [systemsRes, ticketsRes, usersRes] = await Promise.all([
      api.systems.list(),
      api.tickets.list({ ...filters, type: activeTab, page: 1, pageSize: 50 }),
      api.users.list().catch(() => [] as User[]),
    ]);
    setSystems(systemsRes);
    setRows(ticketsRes.items);
    setTotal(ticketsRes.total);
    setUsers(usersRes);
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">Lista filtrable de bugs y requests de cambio.</p>
        </div>
        <div className="rounded-lg bg-white p-1 shadow-soft">
          <button className={`rounded-md px-3 py-2 text-sm ${activeTab === 'BUG' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('BUG')}>Bugs</button>
          <button className={`rounded-md px-3 py-2 text-sm ${activeTab === 'FEATURE' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('FEATURE')}>Features</button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Búsqueda</Label>
            <Input value={filters.q} placeholder="code, título o descripción" onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))} />
          </div>
          <div>
            <Label>Sistema</Label>
            <Select value={filters.systemId} onChange={(e) => setFilters((s) => ({ ...s, systemId: e.target.value }))}>
              <option value="">Todos</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.key}</option>)}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}>
              <option value="">Todos</option>
              {['NEW','TRIAGED','IN_PROGRESS','BLOCKED','READY_FOR_QA','DONE','CANCELLED'].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </div>
          <div>
            <Label>Prioridad</Label>
            <Select value={filters.priority} onChange={(e) => setFilters((s) => ({ ...s, priority: e.target.value }))}>
              <option value="">Todas</option>
              {['LOW','MEDIUM','HIGH','CRITICAL'].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </div>
          <div>
            <Label>Asignado</Label>
            <Select value={filters.assignedToUserId} onChange={(e) => setFilters((s) => ({ ...s, assignedToUserId: e.target.value }))}>
              <option value="">Todos</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
          <div><Label>Desde</Label><Input type="date" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} /></div>
          <div><Label>Hasta</Label><Input type="date" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} /></div>
          <div className="md:col-span-4 flex gap-2">
            <Button onClick={load}>Aplicar filtros</Button>
            <Button variant="outline" onClick={() => setFilters({ systemId:'',status:'',priority:'',assignedToUserId:'',from:'',to:'',q:'' })}>Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{activeTab} ({total})</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <thead><tr><Th>Ticket</Th><Th>Sistema</Th><Th>Status</Th><Th>Prioridad</Th><Th>Asignado</Th><Th>Creado</Th><Th></Th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <Td>
                    <div className="flex items-center gap-2"><TypeBadge type={t.type} /><span className="font-semibold">{t.code}</span></div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.title}</div>
                  </Td>
                  <Td>{t.system?.key}</Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td><PriorityBadge priority={t.priority} /></Td>
                  <Td>{t.assignedToUser?.name ?? '-'}</Td>
                  <Td>{formatDate(t.createdAt)}</Td>
                  <Td><Link to={`/tickets/${t.id}`} className="text-primary hover:underline">Ver</Link></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
