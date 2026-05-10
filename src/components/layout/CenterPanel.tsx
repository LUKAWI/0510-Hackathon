import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CenterPanelProps {
  children?: ReactNode;
  className?: string;
}

export function CenterPanel({ children, className }: CenterPanelProps) {
  return (
    <main className={cn('relative min-w-0 flex-1 overflow-hidden bg-background', className)}>
      {children}
    </main>
  );
}
