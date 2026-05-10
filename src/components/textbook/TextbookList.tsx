import { useCallback, useMemo, useState } from "react";
import { BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextbookItem } from "./TextbookItem";
import { BatchActions } from "./BatchActions";
import { useTextbooks } from "@/hooks/useTextbooks";
import { cn } from "@/lib/utils";
import type { Textbook } from "@/types";

interface TextbookListProps {
  className?: string;
}

function TextbookListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
        >
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-9 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TextbookListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16">
      <BookOpen className="size-10 text-muted-foreground/30" />
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          暂无教材
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          上传教材文件以开始构建知识图谱
        </p>
      </div>
    </div>
  );
}

interface TextbookListErrorProps {
  message: string;
  onRetry: () => void;
}

function TextbookListError({ message, onRetry }: TextbookListErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <AlertTriangle className="size-10 text-destructive/40" />
      <div className="text-center">
        <p className="text-sm font-medium text-destructive">
          加载失败
        </p>
        <p className="mt-0.5 max-w-[200px] text-xs text-destructive/70">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        重试
      </Button>
    </div>
  );
}

function TextbookList({ className }: TextbookListProps) {
  const { data, isLoading, isError, error, refetch } = useTextbooks();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const textbooks = useMemo(() => {
    if (!data) return [];
    return data as readonly Textbook[];
  }, [data]);

  const selectionMode = selectedIds.size > 0;

  const handleSelectionChange = useCallback(
    (id: string, selected: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(textbooks.map((t) => t.id)));
  }, [textbooks]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchDeleteComplete = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <TextbookListSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <TextbookListError
          message={error?.message ?? "未知错误"}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (textbooks.length === 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <TextbookListEmpty />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <BatchActions
        totalCount={textbooks.length}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteComplete={handleBatchDeleteComplete}
      />

      {textbooks.map((textbook, idx) => (
        <TextbookItem
          key={textbook.id}
          textbook={textbook}
          index={idx}
          selected={selectedIds.has(textbook.id)}
          onSelectionChange={handleSelectionChange}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  );
}

export { TextbookList };
export type { TextbookListProps };
