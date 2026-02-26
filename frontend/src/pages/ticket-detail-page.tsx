import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, API_URL } from '@/lib/api';
import { FileDropzone } from '@/components/file-dropzone';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, Td, Th } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import type { SubtaskStatus, Ticket, User } from '@/lib/types';
import { useAuth } from '@/state/auth';

export function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    status: 'TODO' as SubtaskStatus,
    effortHours: '',
    assignedToUserId: '',
  });
  const [subtaskEdits, setSubtaskEdits] = useState<Record<string, {
    title: string;
    status: SubtaskStatus;
    effortHours: string;
    assignedToUserId: string;
  }>>({});
  const [subtaskCommentBodies, setSubtaskCommentBodies] = useState<Record<string, string>>({});
  const [workflow, setWorkflow] = useState({
    status: '',
    assignedToUserId: '',
    priority: '',
    blockedReason: '',
    rootCause: '',
    resolutionSummary: '',
  });

  const load = async () => {
    if (!id) return;
    const [detail, usersRes] = await Promise.all([
      api.tickets.detail(id),
      api.users.list().catch(() => [] as User[]),
    ]);
    setTicket(detail);
    setUsers(usersRes);
    setWorkflow({
      status: detail.status,
      assignedToUserId: detail.assignedToUserId ?? '',
      priority: detail.priority,
      blockedReason: detail.blockedReason ?? '',
      rootCause: detail.rootCause ?? '',
      resolutionSummary: detail.resolutionSummary ?? '',
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!ticket?.subtasks) return;
    const next: Record<string, { title: string; status: SubtaskStatus; effortHours: string; assignedToUserId: string }> = {};
    ticket.subtasks.forEach((s) => {
      next[s.id] = {
        title: s.title,
        status: s.status,
        effortHours: s.effortHours != null ? String(s.effortHours) : '',
        assignedToUserId: s.assignedToUserId ?? '',
      };
    });
    setSubtaskEdits(next);
  }, [ticket?.id, ticket?.subtasks]);

  if (!ticket) return <div className="rounded-xl border border-border bg-white p-6">Cargando ticket...</div>;

  const reporterAttachments = (ticket.attachments ?? []).filter((a) => !a.commentId);
  const subtasks = ticket.subtasks ?? [];
  const isBugLikeType = ticket.type === 'BUG' || ticket.type === 'SUPPORT';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={ticket.type} />
            <span className="text-lg font-semibold">{ticket.code}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{ticket.system?.key}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{ticket.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <tbody>
                  <tr className="border-t border-border"><Th>Creado</Th><Td>{formatDate(ticket.createdAt)}</Td></tr>
                  <tr className="border-t border-border"><Th>Triaged</Th><Td>{formatDate(ticket.triagedAt)}</Td></tr>
                  <tr className="border-t border-border"><Th>In Progress</Th><Td>{formatDate(ticket.startedAt)}</Td></tr>
                  <tr className="border-t border-border"><Th>Resuelto</Th><Td>{formatDate(ticket.resolvedAt)}</Td></tr>
                  <tr className="border-t border-border"><Th>Cerrado</Th><Td>{formatDate(ticket.closedAt)}</Td></tr>
                </tbody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Adjuntos iniciales (REPORTER)</CardTitle></CardHeader>
            <CardContent>
              {reporterAttachments.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin adjuntos iniciales.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {reporterAttachments.map((a) => (
                    <a key={a.id} href={`${API_URL}${a.url}`} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-border bg-white">
                      <img src={`${API_URL}${a.url}`} className="h-24 w-full object-cover" />
                      <div className="truncate p-2 text-xs">{a.fileName}</div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Comentarios</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Agregar comentario..." />
                <FileDropzone files={commentFiles} setFiles={setCommentFiles} label="Adjuntos del comentario" />
                <Button
                  onClick={async () => {
                    if (!id || !commentBody.trim()) return;
                    const created: any = await api.tickets.addComment(id, commentBody);
                    if (commentFiles.length) await api.tickets.uploadCommentAttachments(id, created.id, commentFiles);
                    setCommentBody('');
                    setCommentFiles([]);
                    await load();
                  }}
                >
                  Publicar comentario
                </Button>
              </div>

              <div className="space-y-3">
                {(ticket.comments ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{c.authorUser.name} ({c.authorUser.role})</div>
                      <div className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm">{c.body}</div>
                    {c.attachments.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {c.attachments.map((a) => (
                          <a key={a.id} href={`${API_URL}${a.url}`} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-border">
                            <img src={`${API_URL}${a.url}`} className="h-20 w-full object-cover" />
                            <div className="truncate px-2 py-1 text-[11px]">{a.fileName}</div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {ticket.type === 'FEATURE' && (
            <Card>
              <CardHeader><CardTitle>Subtareas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1.6fr_0.6fr_0.8fr_auto]">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={subtaskForm.title}
                      placeholder="Ej: Implementar módulo de pagos"
                      onChange={(e) => setSubtaskForm((s) => ({ ...s, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={subtaskForm.effortHours}
                      onChange={(e) => setSubtaskForm((s) => ({ ...s, effortHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Asignado</Label>
                    <Select
                      value={subtaskForm.assignedToUserId}
                      onChange={(e) => setSubtaskForm((s) => ({ ...s, assignedToUserId: e.target.value }))}
                    >
                      <option value="">Sin asignar</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={async () => {
                        if (!id || !subtaskForm.title.trim()) return;
                        await api.tickets.createSubtask(id, {
                          title: subtaskForm.title.trim(),
                          status: subtaskForm.status,
                          effortHours: subtaskForm.effortHours === '' ? null : Number(subtaskForm.effortHours),
                          assignedToUserId: subtaskForm.assignedToUserId || null,
                        });
                        setSubtaskForm({ title: '', status: 'TODO', effortHours: '', assignedToUserId: '' });
                        await load();
                      }}
                    >
                      Agregar subtarea
                    </Button>
                  </div>
                </div>

                {subtasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin subtareas.</div>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Subtarea</Th>
                        <Th>Status</Th>
                        <Th>Horas</Th>
                        <Th>Asignado</Th>
                        <Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {subtasks.map((s) => {
                        const draft = subtaskEdits[s.id] ?? {
                          title: s.title,
                          status: s.status,
                          effortHours: s.effortHours != null ? String(s.effortHours) : '',
                          assignedToUserId: s.assignedToUserId ?? '',
                        };
                        return (
                          <Fragment key={s.id}>
                            <tr key={s.id} className="border-t border-border">
                              <Td>
                                <Input
                                  value={draft.title}
                                  onChange={(e) => setSubtaskEdits((prev) => ({
                                    ...prev,
                                    [s.id]: { ...draft, title: e.target.value },
                                  }))}
                                />
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Creado por {s.createdByUser?.name ?? 'Usuario'} · {formatDate(s.createdAt)}
                                </div>
                              </Td>
                              <Td>
                                <Select
                                  value={draft.status}
                                  onChange={(e) => setSubtaskEdits((prev) => ({
                                    ...prev,
                                    [s.id]: { ...draft, status: e.target.value as SubtaskStatus },
                                  }))}
                                >
                                  {['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'].map((v) => <option key={v} value={v}>{v}</option>)}
                                </Select>
                              </Td>
                              <Td>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={draft.effortHours}
                                  onChange={(e) => setSubtaskEdits((prev) => ({
                                    ...prev,
                                    [s.id]: { ...draft, effortHours: e.target.value },
                                  }))}
                                />
                              </Td>
                              <Td>
                                <Select
                                  value={draft.assignedToUserId}
                                  onChange={(e) => setSubtaskEdits((prev) => ({
                                    ...prev,
                                    [s.id]: { ...draft, assignedToUserId: e.target.value },
                                  }))}
                                >
                                  <option value="">Sin asignar</option>
                                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </Select>
                              </Td>
                              <Td className="space-y-2">
                                <Button
                                  onClick={async () => {
                                    if (!id) return;
                                    await api.tickets.updateSubtask(id, s.id, {
                                      title: draft.title.trim(),
                                      status: draft.status,
                                      effortHours: draft.effortHours === '' ? null : Number(draft.effortHours),
                                      assignedToUserId: draft.assignedToUserId || null,
                                    });
                                    await load();
                                  }}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={async () => {
                                    if (!id) return;
                                    await api.tickets.deleteSubtask(id, s.id);
                                    await load();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </Td>
                            </tr>
                            <tr key={`${s.id}-comments`} className="border-t border-border bg-muted/20">
                              <Td colSpan={5}>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Comentarios</div>
                                  {(s.comments ?? []).length === 0 ? (
                                    <div className="text-xs text-muted-foreground">Sin comentarios.</div>
                                  ) : (
                                    <div className="space-y-2">
                                      {(s.comments ?? []).map((c) => (
                                        <div key={c.id} className="rounded-md border border-border bg-white p-2 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{c.authorUser.name} ({c.authorUser.role})</span>
                                            <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                                          </div>
                                          <div className="mt-1 whitespace-pre-wrap">{c.body}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={subtaskCommentBodies[s.id] ?? ''}
                                      onChange={(e) => setSubtaskCommentBodies((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                      placeholder="Agregar comentario..."
                                    />
                                    <Button
                                      onClick={async () => {
                                        if (!id) return;
                                        const body = (subtaskCommentBodies[s.id] ?? '').trim();
                                        if (!body) return;
                                        await api.tickets.addSubtaskComment(id, s.id, body);
                                        setSubtaskCommentBodies((prev) => ({ ...prev, [s.id]: '' }));
                                        await load();
                                      }}
                                    >
                                      Publicar
                                    </Button>
                                  </div>
                                </div>
                              </Td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Workflow / Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Status</Label><Select value={workflow.status} onChange={(e) => setWorkflow((s) => ({ ...s, status: e.target.value }))}>{['NEW','TRIAGED','IN_PROGRESS','BLOCKED','READY_FOR_QA','DONE','CANCELLED'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
              <div>
                <Label>Asignado</Label>
                <Select value={workflow.assignedToUserId} onChange={(e) => setWorkflow((s) => ({ ...s, assignedToUserId: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </Select>
              </div>
              <div><Label>Prioridad</Label><Select value={workflow.priority} onChange={(e) => setWorkflow((s) => ({ ...s, priority: e.target.value }))}>{['LOW','MEDIUM','HIGH','CRITICAL'].map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
              <div><Label>Razón de bloqueo</Label><Textarea value={workflow.blockedReason} onChange={(e) => setWorkflow((s) => ({ ...s, blockedReason: e.target.value }))} /></div>
              <div><Label>Root cause</Label><Textarea value={workflow.rootCause} onChange={(e) => setWorkflow((s) => ({ ...s, rootCause: e.target.value }))} /></div>
              <div><Label>Resolution summary</Label><Textarea value={workflow.resolutionSummary} onChange={(e) => setWorkflow((s) => ({ ...s, resolutionSummary: e.target.value }))} /></div>
              <Button
                className="w-full"
                onClick={async () => {
                  if (!id) return;
                  await api.tickets.workflow(id, {
                    status: workflow.status,
                    assignedToUserId: workflow.assignedToUserId || null,
                    priority: workflow.priority,
                    blockedReason: workflow.blockedReason || null,
                    rootCause: workflow.rootCause || null,
                    resolutionSummary: workflow.resolutionSummary || null,
                  });
                  await load();
                }}
              >
                Guardar cambios
              </Button>
              {(user?.role === 'DEVELOPER' || user?.role === 'ADMIN') && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => api.tickets.workflow(ticket.id, { status: 'IN_PROGRESS' }).then(load)}>Start</Button>
                  <Button variant="secondary" onClick={() => api.tickets.workflow(ticket.id, { status: 'READY_FOR_QA' }).then(load)}>Ready QA</Button>
                  <Button className="col-span-2" onClick={() => api.tickets.workflow(ticket.id, { status: 'DONE' }).then(load)}>Mark DONE</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isBugLikeType && (
            <Card>
              <CardHeader><CardTitle>Detalle técnico BUG / SUPPORT</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-semibold">Severidad:</span> {ticket.severity ?? '-'}</div>
                <div><span className="font-semibold">Reproducible:</span> {ticket.reproducible ? 'Sí' : 'No'}</div>
                <div><div className="font-semibold">Steps</div><div className="mt-1 whitespace-pre-wrap text-muted-foreground">{ticket.stepsToReproduce || '-'}</div></div>
                <div><div className="font-semibold">Expected</div><div className="mt-1 whitespace-pre-wrap text-muted-foreground">{ticket.expectedResult || '-'}</div></div>
                <div><div className="font-semibold">Actual</div><div className="mt-1 whitespace-pre-wrap text-muted-foreground">{ticket.actualResult || '-'}</div></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
