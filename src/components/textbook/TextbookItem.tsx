import { useState } from "react";
import {
  FileText,
  FileCode,
  File,
  FileSpreadsheet,
  Trash2,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/global/ConfirmDialog";
import { cn } from "@/lib/utils";
import { staggerStyle } from "@/lib/animation";
import { formatFileSize } from "@/lib/constants";
import { useDeleteTextbook } from "@/hooks/useTextbooks";
import type { Textbook, TextbookStatus } from "@/types";

interface FileTypeConfig {
  icon: LucideIcon;
  colorClass: string;
  label: string;
}

const FILE_TYPE_MAP: Record<string, FileTypeConfig> = {
  pdf: { icon: FileText, colorClass: "text-red-500", label: "PDF" },
  md: { icon: FileCode, colorClass: "text-blue-500", label: "MD" },
  txt: { icon: File, colorClass: "text-gray-500", label: "TXT" },
  docx: { icon: FileText, colorClass: "text-blue-600", label: "DOCX" },
  xlsx: { icon: FileSpreadsheet, colorClass: "text-green-500", label: "XLSX" },
};

function getFileTypeConfig(fileType: string): FileTypeConfig {
  return FILE_TYPE_MAP[fileType] ?? { icon: File, colorClass: "text-muted-foreground", label: fileType.toUpperCase() };
}

interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

const STATUS_MAP: Record<TextbookStatus, StatusConfig> = {
  uploading: { label: "上传中", variant: "secondary" },
  parsing: { label: "解析中", variant: "secondary" },
  processing: { label: "处理中", variant: "secondary" },
  ready: { label: "就绪", variant: "default" },
  error: { label: "错误", variant: "destructive" },
};

interface TextbookItemProps {
  textbook: Textbook;
  index?: number;
  selected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
  className?: string;
}

function TextbookItem({
  textbook,
  index = 0,
  selected = false,
  onSelectionChange,
  selectionMode = false,
  className,
}: TextbookItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteTextbook();

  const typeConfig = getFileTypeConfig(textbook.filename.split('.').pop() || '');
  const statusConfig = STATUS_MAP[textbook.status as TextbookStatus] || STATUS_MAP.processing;
  const TypeIcon = typeConfig.icon;
  const isDeleting = deleteMutation.isPending;

  function handleDelete() {
    deleteMutation.mutate(textbook.id, {
      onSuccess: () => setShowDeleteConfirm(false),
    });
  }

  function handleCheckboxChange(checked: boolean) {
    onSelectionChange?.(textbook.id, checked);
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50",
          selected && "border-foreground/30 bg-muted/60",
          isDeleting && "pointer-events-none opacity-50",
          className,
        )}
        style={staggerStyle(index)}
      >
        <div
          className={cn(
            "shrink-0 transition-opacity",
            selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckboxChange}
            aria-label={`选择 ${textbook.filename}`}
          />
        </div>

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted",
            typeConfig.colorClass,
          )}
        >
          <TypeIcon className="size-4.5" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium leading-tight">
            {textbook.filename}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(textbook.total_chars)}
          </span>
        </div>

        <Badge variant={statusConfig.variant} className="shrink-0">
          {textbook.status === "processing" && (
            <Loader2 className="size-3 animate-spin" />
          )}
          {statusConfig.label}
        </Badge>

        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          aria-label={`删除 ${textbook.filename}`}
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="删除教材"
        description={`确定要删除「${textbook.filename}」吗？此操作不可撤销，相关的知识图谱数据也将被清除。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

export { TextbookItem };
export type { TextbookItemProps };
