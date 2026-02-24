import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-soft', props.className)} />;
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('p-4 pb-2', props.className)} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn('text-sm font-semibold tracking-tight', props.className)} />;
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('p-4 pt-2', props.className)} />;
}
