import type React from 'react';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>;
}
