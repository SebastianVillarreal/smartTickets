import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function hoursToHuman(hours?: number | null) {
  if (!hours || hours <= 0) return '-';
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h`;
}
