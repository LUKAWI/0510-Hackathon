import type { Textbook, ProcessingTask } from "./textbook";
import type { GraphData, GraphStats, CoherenceViolation } from "./graph";
import type { MergeDecision, CompressionStats } from "./merge";
import type { RAGAnswer } from "./rag";
import type { ChatMessage, Conversation } from "./chat";

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly error: ApiError | null;
  readonly timestamp: string;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details: Record<string, unknown> | null;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export type TextbookListResponse = ApiResponse<readonly Textbook[]>;
export type TextbookDetailResponse = ApiResponse<Textbook>;
export type UploadResponse = ApiResponse<ProcessingTask>;
export type TaskStatusResponse = ApiResponse<ProcessingTask>;

export type GraphDataResponse = ApiResponse<GraphData>;
export type GraphStatsResponse = ApiResponse<GraphStats>;
export type CoherenceCheckResponse = ApiResponse<readonly CoherenceViolation[]>;

export type MergeDecisionsResponse = ApiResponse<readonly MergeDecision[]>;
export type CompressionStatsResponse = ApiResponse<CompressionStats>;

export type RAGQueryResponse = ApiResponse<RAGAnswer>;
export type ChatHistoryResponse = ApiResponse<readonly ChatMessage[]>;
export type ConversationListResponse = ApiResponse<readonly Conversation[]>;

export interface HealthCheckResponse {
  readonly status: "ok" | "degraded" | "down";
  readonly version: string;
  readonly uptime: number;
  readonly database: "connected" | "disconnected";
  readonly embeddingService: "available" | "unavailable";
}

// ─── 兼容别名与通用类型 ──────────────────────────────────

/** @deprecated 使用 ApiError 代替 */
export type ApiErrorDetail = ApiError;

export type AsyncTaskStatus = "pending" | "running" | "done" | "error";

export type AsyncTaskType =
  | "textbook_processing"
  | "graph_building"
  | "rag_indexing"
  | "merge_execution"
  | "report_generation";

export interface AsyncTask {
  readonly id: string;
  readonly type: AsyncTaskType;
  readonly status: AsyncTaskStatus;
  readonly progress: number;
  readonly result: Record<string, unknown> | null;
  readonly error: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IntegrationReport {
  readonly id: string;
  readonly title: string;
  readonly textbookIds: readonly string[];
  readonly compressionStats: CompressionStats;
  readonly totalKnowledgeUnits: number;
  readonly totalGraphNodes: number;
  readonly totalGraphEdges: number;
  readonly createdAt: string;
}
