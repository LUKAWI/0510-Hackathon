import {
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  User,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useLayoutStore } from '@/stores/layout';
import { useProcessingStore } from '@/stores/processing';
import { useIsDesktop } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

// ─── 处理阶段显示文本 ─────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  idle: '就绪',
  uploading: '上传中',
  parsing: '解析中',
  extracting: '提取中',
  building_graph: '构建图谱',
  merging: '整合中',
  indexing: '索引中',
  done: '完成',
  error: '错误',
};

// ─── TopBar ────────────────────────────────────────────────

export function TopBar() {
  const isDesktop = useIsDesktop();
  const leftCollapsed = useLayoutStore((s) => s.leftPanelCollapsed);
  const rightVisible = useLayoutStore((s) => s.rightPanelVisible);
  const toggleLeft = useLayoutStore((s) => s.toggleLeftPanel);
  const toggleRight = useLayoutStore((s) => s.toggleRightPanel);

  const stage = useProcessingStore((s) => s.stage);
  const progress = useProcessingStore((s) => s.progress);
  const currentFile = useProcessingStore((s) => s.currentFile);

  const isProcessing = stage !== 'idle' && stage !== 'done' && stage !== 'error';
  const stageLabel = STAGE_LABELS[stage] ?? stage;

  return (
    <header className="animate-fade-in flex h-14 shrink-0 items-center gap-3 border-b border-border bg-primary px-4 text-primary-foreground">
      {/* ── 左侧：Logo + 项目名 ── */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10 dark:bg-white/10">
          <Zap className="size-4 text-primary-foreground" />
        </div>
        {isDesktop && (
          <h1 className="text-sm font-medium tracking-wide">
            学科知识整合智能体
          </h1>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-5 bg-primary-foreground/20 dark:bg-white/15" />

      {/* ── 左侧面板切换 ── */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={toggleLeft}
        className="min-w-[36px] min-h-[36px] text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        aria-label={leftCollapsed ? '展开左侧面板' : '折叠左侧面板'}
      >
        {leftCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </Button>

      {/* ── 中间：全局状态指示器 ── */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1 text-xs',
            isProcessing
              ? 'bg-primary-foreground/10 text-primary-foreground'
              : stage === 'error'
                ? 'bg-destructive/20 text-destructive-foreground'
                : 'text-primary-foreground/50',
          )}
        >
          {isProcessing ? (
            <Activity className="size-3 animate-pulse" />
          ) : (
            <Activity className="size-3" />
          )}
          <span className="font-medium">{stageLabel}</span>
          {isProcessing && (
            <>
              <span className="text-primary-foreground/40">·</span>
              <span className="tabular-nums">{progress}%</span>
              {currentFile && (
                <>
                  <span className="text-primary-foreground/40">·</span>
                  <span className="max-w-32 truncate text-primary-foreground/60">
                    {currentFile}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 右侧：面板切换 + 用户头像占位 ── */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleRight}
          className="min-w-[36px] min-h-[36px] text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          aria-label={rightVisible ? '隐藏右侧面板' : '显示右侧面板'}
        >
          {rightVisible ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5 bg-primary-foreground/20 dark:bg-white/15" />

        {/* ── 用户头像占位（预留登录扩展点） ── */}
        <Avatar size="sm" className="cursor-pointer ring-1 ring-primary-foreground/20">
          <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground/60">
            <User className="size-3.5" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
