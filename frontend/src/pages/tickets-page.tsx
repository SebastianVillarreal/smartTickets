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
import type { Subtask, SystemItem, Ticket, User } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function TicketsPage() {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rows, setRows] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'BUG' | 'SUPPORT' | 'FEATURE'>('BUG');
  const [subtasksModal, setSubtasksModal] = useState<{
    ticketId: string;
    ticketTitle: string;
    totalHours: number;
  } | null>(null);
  const [modalSubtasks, setModalSubtasks] = useState<Subtask[]>([]);
  const [isLoadingModalSubtasks, setIsLoadingModalSubtasks] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
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

  const openSubtasksModal = async (ticket: Ticket) => {
    setSubtasksModal({
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      totalHours: ticket.subtasksHours ?? 0,
    });
    setModalSubtasks([]);
    setModalError(null);
    setIsLoadingModalSubtasks(true);
    try {
      const subtasks = await api.tickets.listSubtasks(ticket.id);
      setModalSubtasks(subtasks);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'No se pudieron cargar las subtareas');
    } finally {
      setIsLoadingModalSubtasks(false);
    }
  };

  const showHoursColumn = activeTab === 'FEATURE' || activeTab === 'SUPPORT';
  const totalHours = rows.reduce((sum, ticket) => sum + (ticket.subtasksHours ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">Lista filtrable de bugs, soporte y requests de cambio.</p>
        </div>
        <div className="rounded-lg bg-white p-1 shadow-soft">
          <button className={`rounded-md px-3 py-2 text-sm ${activeTab === 'BUG' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('BUG')}>Bugs</button>
          <button className={`rounded-md px-3 py-2 text-sm ${activeTab === 'SUPPORT' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('SUPPORT')}>Soporte</button>
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
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>Sistema</Th>
                <Th>Status</Th>
                <Th>Prioridad</Th>
                {showHoursColumn && <Th>Horas</Th>}
                <Th>Asignado</Th>
                <Th>Creado</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <Td>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={t.type} />
                      <span className="text-base font-semibold text-foreground">{t.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.code}</div>
                  </Td>
                  <Td>{t.system?.key}</Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td><PriorityBadge priority={t.priority} /></Td>
                  {showHoursColumn && (
                    <Td>
                      {activeTab === 'FEATURE' ? (
                        <button
                          type="button"
                          className="rounded-md border border-border bg-muted/40 px-2 py-1 text-sm font-medium text-foreground hover:bg-muted"
                          onClick={() => void openSubtasksModal(t)}
                        >
                          {(t.subtasksHours ?? 0).toFixed(1)}h
                        </button>
                      ) : (
                        <span className="text-sm font-medium">{(t.subtasksHours ?? 0).toFixed(1)}h</span>
                      )}
                    </Td>
                  )}
                  <Td>{t.assignedToUser?.name ?? '-'}</Td>
                  <Td>{formatDate(t.createdAt)}</Td>
                  <Td><Link to={`/tickets/${t.id}`} className="text-primary hover:underline">Ver</Link></Td>
                </tr>
              ))}
            </tbody>
            {showHoursColumn && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/20">
                  <Td colSpan={4} className="text-right font-semibold">Total horas</Td>
                  <Td className="font-semibold">{totalHours.toFixed(1)}h</Td>
                  <Td colSpan={3}></Td>
                </tr>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>

      {subtasksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSubtasksModal(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white shadow-soft"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subtasks-modal-title"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 id="subtasks-modal-title" className="text-lg font-semibold">Subtareas del feature</h2>
                <p className="text-sm text-muted-foreground">
                  {subtasksModal.ticketTitle} · {subtasksModal.totalHours.toFixed(1)}h
                </p>
              </div>
              <Button variant="outline" onClick={() => setSubtasksModal(null)}>Cerrar</Button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              {isLoadingModalSubtasks ? (
                <div className="text-sm text-muted-foreground">Cargando subtareas...</div>
              ) : modalError ? (
                <div className="text-sm text-red-600">{modalError}</div>
              ) : modalSubtasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Este feature no tiene subtareas.</div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Subtarea</Th>
                      <Th>Status</Th>
                      <Th>Horas</Th>
                      <Th>Asignado</Th>
                      <Th>Creado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalSubtasks.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <Td>
                          <div className="font-medium">{s.title}</div>
                          {s.description ? <div className="mt-1 text-xs text-muted-foreground">{s.description}</div> : null}
                        </Td>
                        <Td>{s.status}</Td>
                        <Td>{s.effortHours != null ? `${s.effortHours.toFixed(1)}h` : '-'}</Td>
                        <Td>{s.assignedToUser?.name ?? '-'}</Td>
                        <Td>{formatDate(s.createdAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
