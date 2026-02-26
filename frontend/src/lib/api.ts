import type { Subtask, Ticket, SystemItem, User } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'smarttickets_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/auth/me'),
  systems: {
    list: () => request<SystemItem[]>('/systems'),
    create: (payload: Partial<SystemItem>) => request<SystemItem>('/systems', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<SystemItem>) => request<SystemItem>(`/systems/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id: string) => request<{ success: boolean }>(`/systems/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: () => request<User[]>('/users'),
    create: (payload: Record<string, unknown>) => request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Record<string, unknown>) => request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },
  tickets: {
    list: (query: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return request<{ items: Ticket[]; total: number; page: number; pageSize: number }>(`/tickets?${params.toString()}`);
    },
    detail: (id: string) => request<Ticket>(`/tickets/${id}`),
    create: (payload: Record<string, unknown>) => request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Record<string, unknown>) => request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    workflow: (id: string, payload: Record<string, unknown>) => request<Ticket>(`/tickets/${id}/workflow`, { method: 'PATCH', body: JSON.stringify(payload) }),
    addComment: (id: string, body: string) => request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    uploadInitialAttachments: (id: string, files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      return request(`/tickets/${id}/attachments`, { method: 'POST', body: form });
    },
    uploadCommentAttachments: (id: string, commentId: string, files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      return request(`/tickets/${id}/comments/${commentId}/attachments`, { method: 'POST', body: form });
    },
    deleteAttachment: (ticketId: string, attachmentId: string) => request(`/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' }),
    listSubtasks: (ticketId: string) => request<Subtask[]>(`/tickets/${ticketId}/subtasks`),
    createSubtask: (ticketId: string, payload: Record<string, unknown>) =>
      request<Subtask>(`/tickets/${ticketId}/subtasks`, { method: 'POST', body: JSON.stringify(payload) }),
    updateSubtask: (ticketId: string, subtaskId: string, payload: Record<string, unknown>) =>
      request<Subtask>(`/tickets/${ticketId}/subtasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteSubtask: (ticketId: string, subtaskId: string) =>
      request<{ success: boolean }>(`/tickets/${ticketId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    addSubtaskComment: (ticketId: string, subtaskId: string, body: string) =>
      request(`/tickets/${ticketId}/subtasks/${subtaskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  },
  metrics: {
    dashboard: (query: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      return request(`/metrics/dashboard?${params.toString()}`);
    },
  },
};

export { API_URL };
