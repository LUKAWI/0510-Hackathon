import { useState } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/global/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useBatchDeleteTextbooks } from "@/hooks/useTextbooks";

interface BatchActionsProps {
  totalCount: number;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteComplete: () => void;
  className?: string;
}

function BatchActions({
  totalCount,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onDeleteComplete,
  className,
}: BatchActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const batchDeleteMutation = useBatchDeleteTextbooks();

  const selectedCount = selectedIds.size;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;
  const isDeleting = batchDeleteMutation.isPending;

  if (selectedCount === 0) return null;

  function handleSelectAllChange(checked: boolean) {
    if (checked) {
      onSelectAll();
    } else {
      onDeselectAll();
    }
  }

  function handleBatchDelete() {
    batchDeleteMutation.mutate([...selectedIds], {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onDeleteComplete();
      },
    });
  }

  function handleClearSelection() {
    onDeselectAll();
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-foreground/15 bg-muted/80 px-3 py-2",
          className,
        )}
      >
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAllChange}
          aria-label={isAllSelected ? "取消全选" : "全选"}
          className={
            isPartiallySelected
              ? "opacity-70"
              : undefined
          }
        />

        <span className="text-sm font-medium text-foreground">
          已选择 {selectedCount} 项
        </span>

        <div className="flex-1" />

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          批量删除
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleClearSelection}
          disabled={isDeleting}
          aria-label="取消选择"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="批量删除教材"
        description={`确定要删除选中的 ${selectedCount} 个教材吗？此操作不可撤销，相关的知识图谱数据也将被清除。`}
        confirmLabel={`删除 ${selectedCount} 个教材`}
        cancelLabel="取消"
        variant="destructive"
        onConfirm={handleBatchDelete}
      />
    </>
  );
}

export { BatchActions };
export type { BatchActionsProps };
