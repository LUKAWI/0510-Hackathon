import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadTextbook } from "@/hooks/useTextbooks";

const ALLOWED_EXTENSIONS = [".pdf", ".md", ".txt", ".docx", ".xlsx"] as const;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const uploadFileSchema = z.object({
  file: z
    .instanceof(File, { message: "请选择文件" })
    .refine(
      (file) => {
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
        return ALLOWED_EXTENSIONS.includes(
          ext as (typeof ALLOWED_EXTENSIONS)[number],
        );
      },
      "不支持的文件格式，请上传 PDF / MD / TXT / DOCX / XLSX 文件",
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "文件大小超过 20 MB 限制",
    ),
});

type UploadPhase = "idle" | "uploading" | "success" | "error";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  fileName: string;
  errorMessage: string;
}

const INITIAL_STATE: UploadState = {
  phase: "idle",
  progress: 0,
  fileName: "",
  errorMessage: "",
};

interface FileUploadZoneProps {
  disabled?: boolean;
  className?: string;
}

function FileUploadZone({ disabled = false, className }: FileUploadZoneProps) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTextbook();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const result = uploadFileSchema.safeParse({ file });
      if (!result.success) {
        const firstError = result.error.issues[0];
        setState({
          phase: "error",
          progress: 0,
          fileName: file.name,
          errorMessage: firstError?.message ?? "文件验证失败",
        });
        return;
      }

      setState({
        phase: "uploading",
        progress: 0,
        fileName: file.name,
        errorMessage: "",
      });

      uploadMutation.mutate(
        {
          file,
          onProgress: (percent) => {
            setState((prev) => ({ ...prev, progress: percent }));
          },
        },
        {
          onSuccess: () => {
            setState((prev) => ({
              ...prev,
              phase: "success",
              progress: 100,
            }));
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(resetState, 2000);
          },
          onError: (error) => {
            setState((prev) => ({
              ...prev,
              phase: "error",
              errorMessage:
                error instanceof Error ? error.message : "上传失败，请重试",
            }));
          },
        },
      );
    },
    [uploadMutation, resetState],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      const firstFile = files[0];
      if (firstFile) {
        processFile(firstFile);
      }
    },
    [disabled, processFile],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const firstFile = files?.[0];
      if (firstFile) {
        processFile(firstFile);
      }
      e.target.value = "";
    },
    [processFile],
  );

  const isUploading = state.phase === "uploading";
  const isInteractive = !disabled && !isUploading;

  return (
    <div className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-disabled={!isInteractive}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors",
          isInteractive
            ? "cursor-pointer border-border hover:border-foreground/40 hover:bg-muted/50"
            : "cursor-not-allowed border-border/50 opacity-60",
          isDragOver && isInteractive && "border-foreground/60 bg-muted",
        )}
      >
        {state.phase === "uploading" ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        ) : state.phase === "success" ? (
          <CheckCircle2 className="size-8 text-green-600" />
        ) : state.phase === "error" ? (
          <AlertCircle className="size-8 text-destructive" />
        ) : (
          <Upload className="size-8 text-muted-foreground transition-transform group-hover:scale-110" />
        )}

        <div className="text-center">
          {state.phase === "uploading" ? (
            <>
              <p className="text-sm font-medium">{state.fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                上传中 {state.progress}%
              </p>
            </>
          ) : state.phase === "success" ? (
            <>
              <p className="text-sm font-medium text-green-600">上传成功</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {state.fileName}
              </p>
            </>
          ) : state.phase === "error" ? (
            <>
              <p className="text-sm font-medium text-destructive">上传失败</p>
              <p className="mt-1 text-xs text-destructive/80">
                {state.errorMessage}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">
                拖拽文件到此处，或{" "}
                <span className="text-foreground underline underline-offset-2">
                  点击选择
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持 PDF / MD / TXT / DOCX / XLSX，最大 20 MB
              </p>
            </>
          )}
        </div>

        {isUploading && (
          <Progress value={state.progress} className="w-full max-w-[200px]" />
        )}

        {state.phase === "error" && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              resetState();
            }}
          >
            <FileUp className="size-3.5" />
            重新选择
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={!isInteractive}
          aria-hidden
        />
      </div>
    </div>
  );
}

export { FileUploadZone };
export type { FileUploadZoneProps };
