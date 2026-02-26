import { Badge } from './ui/badge';
import type { Priority, TicketStatus, TicketType } from '@/lib/types';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    NEW: 'bg-slate-100 text-slate-700',
    TRIAGED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    BLOCKED: 'bg-rose-100 text-rose-700',
    READY_FOR_QA: 'bg-cyan-100 text-cyan-700',
    DONE: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-zinc-200 text-zinc-700',
  };
  return <Badge className={styles[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return <Badge className={styles[priority]}>{priority}</Badge>;
}

export function TypeBadge({ type }: { type: TicketType }) {
  const styles: Record<TicketType, string> = {
    BUG: 'bg-red-50 text-red-700',
    SUPPORT: 'bg-orange-50 text-orange-700',
    FEATURE: 'bg-indigo-50 text-indigo-700',
  };
  return <Badge className={styles[type]}>{type}</Badge>;
}
