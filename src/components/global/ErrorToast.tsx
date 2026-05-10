import { useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  FileXIcon,
  HardDriveIcon,
  UploadIcon,
  FileSearchIcon,
  NetworkIcon,
  ServerIcon,
  ClockIcon,
  BotIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useProcessingStore } from "@/stores/processing"
import { parseError, type ErrorCode } from "@/lib/errors"

// ─── Icon per error code ───────────────────────────────────

const ERROR_ICONS: Record<ErrorCode, React.ReactNode> = {
  UNSUPPORTED_FORMAT: <FileXIcon className="size-4" />,
  FILE_TOO_LARGE: <HardDriveIcon className="size-4" />,
  UPLOAD_FAILED: <UploadIcon className="size-4" />,
  PARSE_FAILED: <FileSearchIcon className="size-4" />,
  GRAPH_BUILD_FAILED: <AlertTriangleIcon className="size-4" />,
  API_TIMEOUT: <ClockIcon className="size-4" />,
  API_CLIENT_ERROR: <ServerIcon className="size-4" />,
  API_SERVER_ERROR: <ServerIcon className="size-4" />,
  NETWORK_OFFLINE: <NetworkIcon className="size-4" />,
  LLM_CALL_FAILED: <BotIcon className="size-4" />,
  RENDER_CRASH: <AlertTriangleIcon className="size-4" />,
  UNKNOWN: <AlertTriangleIcon className="size-4" />,
}

// ─── Duration per error severity ───────────────────────────

const ERROR_DURATION: Record<ErrorCode, number> = {
  UNSUPPORTED_FORMAT: 5000,
  FILE_TOO_LARGE: 5000,
  UPLOAD_FAILED: 8000,
  PARSE_FAILED: 8000,
  GRAPH_BUILD_FAILED: 10000,
  API_TIMEOUT: 8000,
  API_CLIENT_ERROR: 6000,
  API_SERVER_ERROR: 10000,
  NETWORK_OFFLINE: 0,        // 0 = 不自动关闭
  LLM_CALL_FAILED: 10000,
  RENDER_CRASH: 0,
  UNKNOWN: 8000,
}

// ─── Standalone toast helper ───────────────────────────────

function showErrorToast(
  error: unknown,
  opts: { onRetry?: () => void; description?: string } = {},
): void {
  const appError = parseError(error)
  const icon = ERROR_ICONS[appError.code]
  const duration = ERROR_DURATION[appError.code]

  toast.error(appError.title, {
    description: opts.description ?? appError.message,
    icon,
    duration,
    action:
      appError.retryable && opts.onRetry
        ? {
            label: (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCwIcon className="size-3" />
                重试
              </span>
            ),
            onClick: opts.onRetry,
          }
        : undefined,
  })
}

// ─── Props ─────────────────────────────────────────────────

interface ErrorToastProps {
  onRetry?: () => void
}

// ─── Component ─────────────────────────────────────────────

function ErrorToast({ onRetry }: ErrorToastProps) {
  const stage = useProcessingStore((s) => s.stage)
  const error = useProcessingStore((s) => s.error)
  const prevErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (stage === "error" && error && error !== prevErrorRef.current) {
      prevErrorRef.current = error
      showErrorToast(error, { onRetry })
    }

    if (stage !== "error") {
      prevErrorRef.current = null
    }
  }, [stage, error, onRetry])

  return null
}

// eslint-disable-next-line react-refresh/only-export-components
export { ErrorToast, showErrorToast }
export type { ErrorToastProps }
