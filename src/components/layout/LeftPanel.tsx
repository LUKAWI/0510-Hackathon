import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useLayoutStore } from '@/stores/layout';
import { cn } from '@/lib/utils';

interface LeftPanelProps {
  children?: ReactNode;
  iconOnly?: boolean;
}

export function LeftPanel({ children, iconOnly = false }: LeftPanelProps) {
  const collapsed = useLayoutStore((s) => s.leftPanelCollapsed);
  const toggle = useLayoutStore((s) => s.toggleLeftPanel);

  if (iconOnly && collapsed) {
    return (
      <TooltipProvider>
        <aside className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-background">
          <div className="flex h-11 w-full items-center justify-center border-b border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggle}
                  className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-foreground"
                  aria-label="展开左侧面板"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">展开教材管理</TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    );
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-background transition-panel',
        iconOnly ? (collapsed ? 'w-14' : 'w-[260px]') : collapsed ? 'w-0 overflow-hidden' : 'w-[260px]',
      )}
    >
      <div className="flex h-11 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">教材管理</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggle}
          className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? '展开左侧面板' : '折叠左侧面板'}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="content-visibility-auto p-4">
          {children ?? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <BookOpen className="size-8 opacity-30" />
              <p className="text-xs tracking-wide">上传教材以开始</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
