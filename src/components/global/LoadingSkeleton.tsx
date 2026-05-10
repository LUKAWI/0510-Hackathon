import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── List Item Skeleton ────────────────────────────────────

interface ListItemSkeletonProps {
  /** 行数，默认 4 */
  count?: number;
  /** 是否显示左侧图标骨架 */
  showIcon?: boolean;
  /** 是否显示右侧徽章骨架 */
  showBadge?: boolean;
  className?: string;
}

function ListItemSkeleton({
  count = 4,
  showIcon = true,
  showBadge = true,
  className,
}: ListItemSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
        >
          {showIcon && <Skeleton className="size-9 rounded-md" />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          {showBadge && <Skeleton className="h-5 w-12 rounded-full" />}
        </div>
      ))}
    </div>
  );
}

// ─── Card Skeleton ─────────────────────────────────────────

interface CardSkeletonProps {
  /** 标题宽度 */
  titleWidth?: string;
  /** 内容行数 */
  lines?: number;
  className?: string;
}

function CardSkeleton({
  titleWidth = "w-32",
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4",
        className,
      )}
    >
      <Skeleton className={cn("h-5", titleWidth)} />
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message Skeleton (for chat-like UIs) ──────────────────

interface MessageSkeletonProps {
  /** 消息条数 */
  count?: number;
  className?: string;
}

function MessageSkeleton({ count = 3, className }: MessageSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4 px-4 py-3", className)}>
      {Array.from({ length: count }, (_, i) => {
        const isUser = i % 2 === 0;
        return (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div
              className={cn(
                "flex flex-col gap-1.5",
                isUser ? "items-end" : "items-start",
              )}
            >
              <Skeleton
                className={cn(
                  "h-3 w-16 rounded-md",
                  isUser ? "ml-auto" : "",
                )}
              />
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-xl border bg-card px-4 py-3",
                  isUser ? "items-end" : "items-start",
                )}
              >
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Graph Skeleton (canvas placeholder) ───────────────────

interface GraphSkeletonProps {
  className?: string;
}

function GraphSkeleton({ className }: GraphSkeletonProps) {
  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0">
        {Array.from({ length: 8 }, (_, i) => {
          const positions = [
            { top: "15%", left: "20%" },
            { top: "25%", left: "60%" },
            { top: "45%", left: "35%" },
            { top: "30%", left: "80%" },
            { top: "60%", left: "15%" },
            { top: "55%", left: "55%" },
            { top: "70%", left: "75%" },
            { top: "75%", left: "40%" },
          ];
          const pos = positions[i]!;
          const size = 28 + (i % 3) * 12;
          return (
            <div
              key={i}
              className="absolute animate-pulse rounded-full bg-accent"
              style={{
                top: pos.top,
                left: pos.left,
                width: size,
                height: size,
                animationDelay: `${i * 150}ms`,
              }}
            />
          );
        })}
      </div>

      <svg className="absolute inset-0 size-full" aria-hidden="true">
        <line
          x1="22%"
          y1="17%"
          x2="62%"
          y2="27%"
          className="stroke-border animate-pulse"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <line
          x1="37%"
          y1="47%"
          x2="62%"
          y2="27%"
          className="stroke-border animate-pulse"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          style={{ animationDelay: "200ms" }}
        />
        <line
          x1="17%"
          y1="62%"
          x2="37%"
          y2="47%"
          className="stroke-border animate-pulse"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          style={{ animationDelay: "400ms" }}
        />
        <line
          x1="57%"
          y1="57%"
          x2="77%"
          y2="72%"
          className="stroke-border animate-pulse"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          style={{ animationDelay: "600ms" }}
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70">构建知识图谱…</p>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────

interface EmptyStateProps {
  /** 图标组件 */
  icon: LucideIcon;
  /** 主标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作区域（按钮等） */
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 py-16",
        className,
      )}
    >
      <Icon className="size-10 text-muted-foreground/30" />
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// ─── Exports ───────────────────────────────────────────────

export {
  ListItemSkeleton,
  CardSkeleton,
  MessageSkeleton,
  GraphSkeleton,
  EmptyState,
};

export type {
  ListItemSkeletonProps,
  CardSkeletonProps,
  MessageSkeletonProps,
  GraphSkeletonProps,
  EmptyStateProps,
};
