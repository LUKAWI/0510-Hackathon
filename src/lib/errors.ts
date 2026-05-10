/**
 * 集中式错误类型定义与工具函数
 *
 * 覆盖所有业务场景的错误分类，供 ErrorToast / ErrorBoundary 统一消费。
 */

// ─── Error Codes ──────────────────────────────────────────

export const ErrorCode = {
  // 文件相关
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  PARSE_FAILED: "PARSE_FAILED",

  // 图谱相关
  GRAPH_BUILD_FAILED: "GRAPH_BUILD_FAILED",

  // API 相关
  API_TIMEOUT: "API_TIMEOUT",
  API_CLIENT_ERROR: "API_CLIENT_ERROR",   // 4xx
  API_SERVER_ERROR: "API_SERVER_ERROR",   // 5xx

  // 网络
  NETWORK_OFFLINE: "NETWORK_OFFLINE",

  // LLM
  LLM_CALL_FAILED: "LLM_CALL_FAILED",

  // React 渲染
  RENDER_CRASH: "RENDER_CRASH",

  // 未知
  UNKNOWN: "UNKNOWN",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// ─── Structured App Error ─────────────────────────────────

export interface AppError {
  /** 错误码 */
  code: ErrorCode
  /** 用户可读的简短标题 */
  title: string
  /** 详细描述（可展示给用户） */
  message: string
  /** 是否可重试 */
  retryable: boolean
  /** 原始错误（调试用，不展示给用户） */
  cause?: unknown
}

// ─── Factory Helpers ──────────────────────────────────────

export function createAppError(
  code: ErrorCode,
  message: string,
  opts: { title?: string; retryable?: boolean; cause?: unknown } = {},
): AppError {
  return {
    code,
    title: opts.title ?? ERROR_TITLES[code],
    message,
    retryable: opts.retryable ?? ERROR_RETRYABLE[code],
    cause: opts.cause,
  }
}

// ─── Error Title Map ──────────────────────────────────────

const ERROR_TITLES: Record<ErrorCode, string> = {
  UNSUPPORTED_FORMAT: "格式不支持",
  FILE_TOO_LARGE: "文件过大",
  UPLOAD_FAILED: "上传失败",
  PARSE_FAILED: "解析失败",
  GRAPH_BUILD_FAILED: "图谱构建失败",
  API_TIMEOUT: "请求超时",
  API_CLIENT_ERROR: "请求错误",
  API_SERVER_ERROR: "服务器错误",
  NETWORK_OFFLINE: "网络断开",
  LLM_CALL_FAILED: "模型调用失败",
  RENDER_CRASH: "页面错误",
  UNKNOWN: "未知错误",
}

// ─── Retryable Map ────────────────────────────────────────

const ERROR_RETRYABLE: Record<ErrorCode, boolean> = {
  UNSUPPORTED_FORMAT: false,
  FILE_TOO_LARGE: false,
  UPLOAD_FAILED: true,
  PARSE_FAILED: true,
  GRAPH_BUILD_FAILED: true,
  API_TIMEOUT: true,
  API_CLIENT_ERROR: false,   // 4xx 通常不可重试
  API_SERVER_ERROR: true,    // 5xx 可重试
  NETWORK_OFFLINE: true,
  LLM_CALL_FAILED: true,
  RENDER_CRASH: true,
  UNKNOWN: true,
}

// ─── Error Parsing / Classification ───────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

const SUPPORTED_EXTENSIONS = [".pdf", ".md", ".txt", ".docx", ".xlsx"] as const

/**
 * 从原始错误中解析出结构化 AppError。
 * 支持 ApiClientError、DOMException、普通 Error 和字符串。
 */
export function parseError(error: unknown): AppError {
  // ── 网络离线 ──
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return createAppError(
      ErrorCode.NETWORK_OFFLINE,
      "网络连接已断开，请检查网络后重试",
    )
  }

  // ── AbortError (超时 / 取消) ──
  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError(
      ErrorCode.API_TIMEOUT,
      "请求超时，服务器响应时间过长",
    )
  }

  // ── ApiClientError ──
  if (isApiClientError(error)) {
    const status = error.status

    if (status === 0) {
      // 网络错误
      return createAppError(ErrorCode.NETWORK_OFFLINE, error.message)
    }

    if (status === 408 || status === 504) {
      return createAppError(ErrorCode.API_TIMEOUT, error.message)
    }

    if (status >= 500) {
      return createAppError(ErrorCode.API_SERVER_ERROR, error.message)
    }

    if (status >= 400) {
      return createAppError(ErrorCode.API_CLIENT_ERROR, error.message)
    }
  }

  // ── TypeError (fetch 失败 → 网络断开) ──
  if (error instanceof TypeError && /fetch|network|Failed to fetch/i.test(error.message)) {
    return createAppError(ErrorCode.NETWORK_OFFLINE, "无法连接到服务器，请检查网络")
  }

  // ── 从消息字符串中推断 ──
  if (error instanceof Error || typeof error === "string") {
    const msg = typeof error === "string" ? error : error.message
    const lower = msg.toLowerCase()

    if (/不支持|unsupported|格式|format/i.test(msg)) {
      return createAppError(ErrorCode.UNSUPPORTED_FORMAT, msg)
    }
    if (/过大|too large|size limit|20\s*mb|超过/i.test(msg)) {
      return createAppError(ErrorCode.FILE_TOO_LARGE, msg)
    }
    if (/上传|upload/i.test(msg)) {
      return createAppError(ErrorCode.UPLOAD_FAILED, msg)
    }
    if (/解析|parse|parsing/i.test(msg)) {
      return createAppError(ErrorCode.PARSE_FAILED, msg)
    }
    if (/图谱|graph|构建/i.test(msg)) {
      return createAppError(ErrorCode.GRAPH_BUILD_FAILED, msg)
    }
    if (/超时|timeout/i.test(lower)) {
      return createAppError(ErrorCode.API_TIMEOUT, msg)
    }
    if (/llm|模型|通义|qwen|embedding/i.test(lower)) {
      return createAppError(ErrorCode.LLM_CALL_FAILED, msg)
    }
  }

  // ── Fallback ──
  const fallbackMsg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "发生未知错误"

  return createAppError(ErrorCode.UNKNOWN, fallbackMsg, { cause: error })
}

// ─── File Validation ──────────────────────────────────────

/**
 * 校验上传文件，返回 AppError（不通过）或 null（通过）。
 */
export function validateFile(file: File): AppError | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()

  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return createAppError(
      ErrorCode.UNSUPPORTED_FORMAT,
      `不支持的文件格式 "${ext}"，仅支持 PDF、Markdown、DOCX`,
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return createAppError(
      ErrorCode.FILE_TOO_LARGE,
      `文件大小 ${sizeMB}MB 超过 20MB 限制`,
    )
  }

  return null
}

// ─── Type Guard ───────────────────────────────────────────

function isApiClientError(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  )
}
