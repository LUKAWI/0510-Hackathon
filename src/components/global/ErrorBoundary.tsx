import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangleIcon, RefreshCwIcon, CopyIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { parseError, type AppError } from "@/lib/errors"

// ─── Props ─────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  /** 自定义 fallback UI — 不传则使用默认卡片 */
  fallback?: (error: AppError, reset: () => void) => ReactNode
  /** 错误发生后的回调（用于上报） */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: AppError | null
  copied: boolean
}

// ─── Component ─────────────────────────────────────────────

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null, copied: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: parseError(error), copied: false }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ error: null, copied: false })
  }

  private handleCopy = async (): Promise<void> => {
    const { error } = this.state
    if (!error) return

    const text = [
      `错误: ${error.title}`,
      `描述: ${error.message}`,
      `错误码: ${error.code}`,
      error.cause instanceof Error ? `堆栈:\n${error.cause.stack}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    try {
      await navigator.clipboard.writeText(text)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch {
      // clipboard API 可能不可用
    }
  }

  render(): ReactNode {
    const { error, copied } = this.state
    const { children, fallback } = this.props

    if (!error) return children

    if (fallback) return fallback(error, this.handleReset)

    return (
      <div
        data-slot="error-boundary"
        className="flex min-h-[320px] items-center justify-center p-6"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangleIcon className="size-6 text-destructive" />
            </div>
            <CardTitle className="mt-3 text-lg">{error.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {error.message}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <code className="break-all font-mono text-xs text-muted-foreground">
                错误码: {error.code}
              </code>
            </div>
          </CardContent>

          <CardFooter className="justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleCopy}
            >
              {copied ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {copied ? "已复制" : "复制详情"}
            </Button>

            {error.retryable && (
              <Button size="sm" onClick={this.handleReset}>
                <RefreshCwIcon className="size-3.5" />
                重试
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }
}

export { ErrorBoundary }
export type { ErrorBoundaryProps }
