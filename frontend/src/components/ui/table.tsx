import { cn } from '@/lib/utils';
import * as React from 'react';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={cn('w-full text-sm', className)} />;
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cn('px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} />;
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn('px-3 py-2 align-top', className)} />;
}
