import * as React from 'react';
import { cn } from '@/lib/utils';

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        props.className,
      )}
    />
  );
}
