import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDropzone } from '@/components/file-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { SystemItem } from '@/lib/types';

export function NewTicketPage() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'BUG',
    systemId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    severity: 'S3',
    environment: 'QA',
    reproducible: true,
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    tags: '',
  });

  useEffect(() => {
    api.systems.list().then(setSystems);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo Ticket</h1>
        <p className="text-sm text-muted-foreground">Registro de BUG o FEATURE con adjuntos iniciales.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Formulario</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setError(null);
              try {
                const created = await api.tickets.create({
                  ...form,
                  tags: form.tags,
                  severity: form.type === 'BUG' ? form.severity : undefined,
                  stepsToReproduce: form.type === 'BUG' ? form.stepsToReproduce : undefined,
                  expectedResult: form.type === 'BUG' ? form.expectedResult : undefined,
                  actualResult: form.type === 'BUG' ? form.actualResult : undefined,
                });
                if (files.length) await api.tickets.uploadInitialAttachments(created.id, files);
                navigate(`/tickets/${created.id}`);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al crear ticket');
              } finally {
                setSaving(false);
              }
            }}
          >
            <div><Label>Tipo</Label><Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}><option value="BUG">BUG</option><option value="FEATURE">FEATURE</option></Select></div>
            <div>
              <Label>Sistema</Label>
              <Select value={form.systemId} onChange={(e) => setForm((s) => ({ ...s, systemId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {systems.map((s) => <option key={s.id} value={s.id}>{s.key} - {s.name}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Título</Label><Input required value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Descripción</Label><Textarea required value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></div>
            <div><Label>Prioridad</Label><Select value={form.priority} onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}>{['LOW','MEDIUM','HIGH','CRITICAL'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
            <div><Label>Ambiente</Label><Select value={form.environment} onChange={(e) => setForm((s) => ({ ...s, environment: e.target.value }))}>{['DEV','QA','PROD'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
            {form.type === 'BUG' && (
              <>
                <div><Label>Severidad</Label><Select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))}>{['S1','S2','S3','S4'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
                <div><Label>Reproducible</Label><Select value={String(form.reproducible)} onChange={(e) => setForm((s) => ({ ...s, reproducible: e.target.value === 'true' }))}><option value="true">Sí</option><option value="false">No</option></Select></div>
                <div className="md:col-span-2"><Label>Steps</Label><Textarea value={form.stepsToReproduce} onChange={(e) => setForm((s) => ({ ...s, stepsToReproduce: e.target.value }))} /></div>
                <div className="md:col-span-2"><Label>Expected</Label><Textarea value={form.expectedResult} onChange={(e) => setForm((s) => ({ ...s, expectedResult: e.target.value }))} /></div>
                <div className="md:col-span-2"><Label>Actual</Label><Textarea value={form.actualResult} onChange={(e) => setForm((s) => ({ ...s, actualResult: e.target.value }))} /></div>
              </>
            )}
            <div className="md:col-span-2"><Label>Tags (CSV)</Label><Input value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} placeholder="checkout,payment,incident" /></div>
            <div className="md:col-span-2"><FileDropzone files={files} setFiles={setFiles} label="Adjuntos iniciales del reportante" /></div>
            {error && <div className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="md:col-span-2 flex gap-2">
              <Button disabled={saving}>{saving ? 'Guardando...' : 'Crear ticket'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
