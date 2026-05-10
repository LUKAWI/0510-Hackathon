import type { GraphNode, GraphEdge } from "./graph";

export interface Citation {
  readonly textbook: string;
  readonly chapter: string;
  readonly snippet: string;
  readonly relevance: number;
}

export interface GraphContext {
  readonly nodes: ReadonlyArray<Pick<GraphNode, "id" | "label" | "type">>;
  readonly edges: ReadonlyArray<Pick<GraphEdge, "source" | "target" | "relation">>;
}

export interface RAGAnswer {
  readonly answer: string;
  readonly sources: readonly Citation[];
  readonly graphContext: GraphContext | null;
}

export interface RAGRequest {
  readonly question: string;
  readonly top_k: number;
}

export interface RAGResponse {
  readonly answer: string;
  readonly citations: readonly Citation[];
  readonly source_chunks: readonly string[];
}

export interface RetrievalResult {
  readonly chunkId: string;
  readonly content: string;
  readonly similarity: number;
  readonly metadata: RetrievalMetadata;
}

export interface RetrievalMetadata {
  readonly book: string;
  readonly chapter: string;
  readonly unitId: string | null;
  readonly unitName: string | null;
}

export interface HallucinationCheck {
  readonly hasHallucination: boolean;
  readonly issues: readonly string[];
  readonly sourceOverlap: number;
}

// ─── 兼容别名与 API 请求/响应 ──────────────────────────────

/** @deprecated 使用 RAGRequest 代替 */
export type RAGQueryRequest = RAGRequest;

export interface RAGIndexRequest {
  readonly documentId: string;
  readonly forceRebuild: boolean;
}

export interface RAGIndexStatus {
  readonly documentId: string;
  readonly indexed: boolean;
  readonly chunkCount: number;
  readonly builtAt: string | null;
}
