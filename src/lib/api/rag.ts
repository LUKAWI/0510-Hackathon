import type {
  RAGQueryRequest,
  RAGResponse,
} from '@/types';
import { get, post } from './client';

const PATHS = {
  query: 'rag/query',
  status: 'rag/status',
  index: 'rag/index',
} as const;

export function queryRAG(
  request: RAGQueryRequest,
  signal?: AbortSignal,
): Promise<RAGResponse> {
  return post<RAGResponse>(PATHS.query, request, signal);
}

export function getIndexStatus(
  signal?: AbortSignal,
): Promise<{ indexed_textbooks: number; total_chunks: number }> {
  return get(PATHS.status, undefined, signal);
}

export function buildIndex(
  request: { textbook_ids?: string[] },
  signal?: AbortSignal,
): Promise<{ task_id: string; status: string }> {
  return post(PATHS.index, request, signal);
}
