import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/layout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PanelTabs } from '@/components/layout/PanelTabs';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  drawer?: boolean;
}

export function RightPanel({ drawer = false }: RightPanelProps) {
  const visible = useLayoutStore((s) => s.rightPanelVisible);
  const toggle = useLayoutStore((s) => s.toggleRightPanel);
  const bp = useBreakpoint();

  if (drawer) {
    const drawerHeight = bp === 'medium' ? 'h-[420px]' : 'h-[380px]';

    return (
      <div
        className={cn(
          'flex shrink-0 flex-col border-t border-border bg-background transition-panel',
          visible ? drawerHeight : 'h-0 overflow-hidden',
        )}
      >
        <div className="flex h-10 items-center justify-between border-b border-border px-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggle}
            className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-foreground"
            aria-label={visible ? '收起功能面板' : '展开功能面板'}
          >
            {visible ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronUp className="size-3.5" />
            )}
          </Button>
          <span className="text-sm font-medium text-foreground">功能面板</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggle}
            className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-foreground"
            aria-label="关闭功能面板"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="flex justify-center py-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex-1 overflow-auto">
          <PanelTabs />
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-l border-border bg-background transition-panel',
        visible ? 'w-[400px]' : 'w-0 overflow-hidden',
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-medium text-foreground">功能面板</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggle}
          className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-foreground"
          aria-label="关闭右侧面板"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelTabs />
      </div>
    </aside>
  );
}
