import { Database, Layers, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatNumber } from "@/lib/utils";
import type { RAGIndexStatus } from "@/types";

interface IndexStatusProps {
  /** Index status for each indexed textbook */
  readonly indexStatuses: readonly RAGIndexStatus[];
  /** Total number of textbooks in the system */
  readonly totalTextbooks: number;
  /** Whether data is still loading */
  readonly isLoading?: boolean;
  /** Error message if loading failed */
  readonly error?: string | null;
  /** Callback to retry loading */
  readonly onRetry?: () => void;
  readonly className?: string;
}

function IndexStatusSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

function IndexStatusError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <AlertCircle className="size-5 text-destructive/60" />
      <p className="text-xs text-destructive">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          重试
        </button>
      )}
    </div>
  );
}

function getOverallProgress(indexStatuses: readonly RAGIndexStatus[]): number {
  if (indexStatuses.length === 0) return 0;
  const indexedCount = indexStatuses.filter((s) => s.indexed).length;
  return Math.round((indexedCount / indexStatuses.length) * 100);
}

function getTotalChunks(indexStatuses: readonly RAGIndexStatus[]): number {
  return indexStatuses.reduce((sum, s) => sum + s.chunkCount, 0);
}

function getIndexedCount(indexStatuses: readonly RAGIndexStatus[]): number {
  return indexStatuses.filter((s) => s.indexed).length;
}

function IndexStatus({
  indexStatuses,
  totalTextbooks,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: IndexStatusProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <IndexStatusSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <IndexStatusError message={error} onRetry={onRetry} />
      </div>
    );
  }

  const indexedCount = getIndexedCount(indexStatuses);
  const totalChunks = getTotalChunks(indexStatuses);
  const progress = getOverallProgress(indexStatuses);
  const allIndexed = indexedCount === totalTextbooks && totalTextbooks > 0;
  const isBuilding = indexedCount > 0 && indexedCount < totalTextbooks;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Database className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-tight">
                已索引教材
              </span>
              <Badge
                variant={allIndexed ? "default" : isBuilding ? "secondary" : "outline"}
                className="gap-1"
              >
                {isBuilding && <Loader2 className="size-3 animate-spin" />}
                {allIndexed && <CheckCircle2 className="size-3" />}
                {indexedCount}/{totalTextbooks}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {allIndexed
                ? "全部教材已就绪"
                : isBuilding
                  ? "索引构建中…"
                  : totalTextbooks === 0
                    ? "暂无教材"
                    : "部分教材待索引"}
            </span>
          </div>
        </div>

        {totalTextbooks > 0 && (
          <div className="flex flex-col gap-1.5">
            <Progress value={progress} className="h-1.5" />
            <span className="text-[11px] text-muted-foreground">
              {progress}% 完成
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Layers className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium leading-tight">
              知识块总数
            </span>
            <span className="text-xs text-muted-foreground">
              {totalChunks > 0
                ? `${formatNumber(totalChunks)} 个文本块已向量化`
                : "暂无知识块"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IndexStatus };
export type { IndexStatusProps };
