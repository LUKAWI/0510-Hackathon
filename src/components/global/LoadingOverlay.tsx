import { Loader2Icon } from "lucide-react"
import { useProcessingStore, type ProcessingStage } from "@/stores/processing"
import { Progress } from "@/components/ui/progress"

// ─── Stage Labels ──────────────────────────────────────────

const stageLabels: Record<ProcessingStage, string> = {
  idle: "",
  uploading: "上传中",
  parsing: "解析文档",
  extracting: "提取知识",
  building_graph: "构建图谱",
  aligning: "对齐知识",
  merging: "整合知识",
  indexing: "建立索引",
  done: "完成",
  error: "出错",
}

// ─── Component ─────────────────────────────────────────────

function LoadingOverlay() {
  const stage = useProcessingStore((s) => s.stage)
  const progress = useProcessingStore((s) => s.progress)
  const currentFile = useProcessingStore((s) => s.currentFile)

  const isVisible =
    stage !== "idle" && stage !== "done" && stage !== "error"

  if (!isVisible) return null

  return (
    <div
      data-slot="loading-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div
        data-slot="loading-overlay-content"
        className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card p-8 shadow-lg"
      >
        <div className="relative">
          <Loader2Icon
            className="size-10 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-medium text-foreground">
            {stageLabels[stage]}
          </p>
          {currentFile && (
            <p className="max-w-[240px] truncate text-xs text-muted-foreground">
              {currentFile}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  )
}

export { LoadingOverlay }
