import type { Citation } from "./rag";

export type MessageRole = "user" | "assistant" | "system";

export type ChatIntent =
  | "query"
  | "modify_decision"
  | "undo"
  | "confirm"
  | "reject"
  | "explore";

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: string;
  readonly sources: readonly Citation[] | null;
  readonly intent: ChatIntent | null;
  readonly isStreaming: boolean;
}

export interface Conversation {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly ChatMessage[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messageCount: number;
}

export interface ConversationSummary {
  readonly summary: string;
  readonly keyEntities: readonly string[];
  readonly messageRange: {
    readonly from: number;
    readonly to: number;
  };
}

export interface IntentRecognition {
  readonly intent: ChatIntent;
  readonly targetEntities: readonly string[];
  readonly targetDecisions: readonly string[];
  readonly parameters: Record<string, unknown>;
  readonly confidence: number;
}

export interface ReferenceResolution {
  readonly originalText: string;
  readonly resolvedText: string;
  readonly resolvedEntities: readonly string[];
}

export interface StreamingChunk {
  readonly conversationId: string;
  readonly messageId: string;
  readonly delta: string;
  readonly done: boolean;
  readonly sources: readonly Citation[] | null;
}

// ─── 兼容别名与 API 请求/响应 ──────────────────────────────

/** @deprecated 使用 ChatMessage 代替 */
export type ConversationMessage = ChatMessage;

export interface ConversationListParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
}

export interface SendMessageRequest {
  readonly session_id: string;
  readonly message: string;
}

export interface SendMessageResponse {
  readonly session_id: string;
  readonly reply: string;
  readonly citations: readonly Citation[];
  readonly memories_used: readonly string[];
  readonly new_memories: {
    readonly interests: readonly string[];
    readonly goals: readonly string[];
    readonly preferences: Record<string, unknown>;
    readonly key_facts: readonly string[];
  };
}
