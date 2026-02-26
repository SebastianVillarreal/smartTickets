import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, Td, Th } from '@/components/ui/table';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/common';
import { formatDate, hoursToHuman } from '@/lib/utils';
import type { SystemItem } from '@/lib/types';

type DashboardData = Awaited<ReturnType<typeof api.metrics.dashboard>>;

export function DashboardPage() {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '', systemId: '', type: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [systemsRes, metrics] = await Promise.all([api.systems.list(), api.metrics.dashboard(filters)]);
      setSystems(systemsRes);
      setData(metrics as DashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const kpis = data?.kpis;
  const kpiCards = useMemo(
    () => [
      { label: 'Tickets abiertos', value: kpis?.openTickets ?? 0 },
      { label: 'Bugs abiertos', value: kpis?.openBugs ?? 0 },
      { label: 'Features pendientes', value: kpis?.pendingFeatures ?? 0 },
      { label: 'Prom. resolución (30d)', value: hoursToHuman(kpis?.avgResolutionHours30d) },
      { label: '% SLA (30d)', value: `${kpis?.slaResolvedPercent30d ?? 0}%` },
    ],
    [kpis],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard Dirección</h1>
        <p className="text-sm text-muted-foreground">Visión ejecutiva de bugs/soporte, features y capacidad de resolución.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros globales</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div><Label>Desde</Label><Input type="date" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} /></div>
          <div><Label>Hasta</Label><Input type="date" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} /></div>
          <div>
            <Label>Sistema</Label>
            <Select value={filters.systemId} onChange={(e) => setFilters((s) => ({ ...s, systemId: e.target.value }))}>
              <option value="">Todos</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.key} - {s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={filters.type} onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}>
              <option value="">ALL</option>
              <option value="BUG">BUG</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="FEATURE">FEATURE</option>
            </Select>
          </div>
          <div className="md:col-span-4">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white" onClick={load} disabled={loading}>
              {loading ? 'Actualizando...' : 'Aplicar filtros'}
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tendencia semanal: creados vs resueltos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.weeklyTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#1d4ed8" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribución por status</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.statusDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bugs" stackId="a" fill="#ef4444" />
                <Bar dataKey="features" stackId="a" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 5 sistemas con más bugs abiertos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data?.charts?.topSystemsByOpenBugs ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="key" type="category" width={65} />
                <Tooltip />
                <Bar dataKey="openBugs" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tiempo de resolución por prioridad</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.charts?.resolutionByPriority ?? []).map((r: any) => ({ ...r, avgDays: r.avgResolutionHours / 24, medianDays: r.medianResolutionHours / 24 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgDays" name="Promedio (días)" fill="#2563eb" />
                <Bar dataKey="medianDays" name="Mediana (días)" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tickets críticos abiertos</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <thead><tr><Th>Ticket</Th><Th>Sistema</Th><Th>Status</Th><Th>Edad</Th></tr></thead>
              <tbody>
                {(data?.executiveTables?.criticalOpenTickets ?? []).map((t: any) => (
                  <tr key={t.id} className="border-t border-border">
                    <Td>
                      <div className="flex items-center gap-2"><TypeBadge type={t.type} /><span className="font-semibold">{t.code}</span></div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.title}</div>
                      <div className="mt-1"><PriorityBadge priority={t.priority} /></div>
                    </Td>
                    <Td>{t.system?.key}</Td>
                    <Td><StatusBadge status={t.status} /></Td>
                    <Td>{t.ageDays}d</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Features top pendientes</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <thead><tr><Th>Ticket</Th><Th>Sistema</Th><Th>Status</Th><Th>Creado</Th></tr></thead>
              <tbody>
                {(data?.executiveTables?.topPendingFeatures ?? []).map((t: any) => (
                  <tr key={t.id} className="border-t border-border">
                    <Td>
                      <div className="font-semibold">{t.code}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.title}</div>
                      <div className="mt-1"><PriorityBadge priority={t.priority} /></div>
                    </Td>
                    <Td>{t.system?.key}</Td>
                    <Td><StatusBadge status={t.status} /></Td>
                    <Td>{formatDate(t.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
