import type {
  SendMessageRequest,
  SendMessageResponse,
} from '@/types';
import { get, post } from './client';

const PATHS = {
  message: 'chat/message',
  history: (sessionId: string) => `chat/history/${sessionId}`,
  memories: (sessionId: string) => `chat/memories/${sessionId}`,
} as const;

export function sendMessage(
  request: SendMessageRequest,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  return post<SendMessageResponse>(PATHS.message, request, signal);
}

export function getChatHistory(
  sessionId: string,
  signal?: AbortSignal,
): Promise<Array<{ role: string; content: string; metadata: Record<string, unknown>; created_at: string }>> {
  return get(PATHS.history(sessionId), undefined, signal);
}

export function getChatMemories(
  sessionId: string,
  signal?: AbortSignal,
): Promise<{ session_id: string; profile: { interests: string[]; preferences: Record<string, unknown>; summary: string } }> {
  return get(PATHS.memories(sessionId), undefined, signal);
}
