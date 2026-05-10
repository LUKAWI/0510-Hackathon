import { Wifi, Database, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useProcessingStore } from '@/stores/processing';
import { cn } from '@/lib/utils';

export function BottomBar() {
  const stage = useProcessingStore((s) => s.stage);
  const error = useProcessingStore((s) => s.error);

  return (
    <footer className="flex h-8 shrink-0 items-center gap-3 border-t border-border bg-primary px-4 text-xs tracking-wide text-primary-foreground/60 dark:bg-card dark:text-foreground dark:border-border">
      <div className="flex items-center gap-1.5">
        <Database className="size-3" />
        <span>Neon PostgreSQL</span>
      </div>

      <Separator orientation="vertical" className="h-3 bg-primary-foreground/20 dark:bg-white/15" />

      <div className="flex items-center gap-1.5">
        <Wifi className="size-3" />
        <span>API 已连接</span>
      </div>

      <Separator orientation="vertical" className="h-3 bg-primary-foreground/20 dark:bg-white/15" />

      <div className="flex items-center gap-1.5">
        <Clock className="size-3" />
        <span>向量维度 1536</span>
      </div>

      <div className="flex-1" />

      {stage === 'error' && error && (
        <span className="truncate text-destructive-foreground">
          {error}
        </span>
      )}

      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          stage === 'error'
            ? 'bg-destructive/20 text-destructive-foreground'
            : stage === 'done'
              ? 'bg-primary-foreground/10 dark:bg-white/10 text-primary-foreground/80'
              : 'text-primary-foreground/40',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            stage === 'error'
              ? 'bg-destructive'
              : stage === 'done'
                ? 'bg-primary-foreground/60'
                : 'bg-primary-foreground/30',
          )}
        />
        {stage === 'error' ? '异常' : stage === 'done' ? '就绪' : '待机'}
      </span>
    </footer>
  );
}
