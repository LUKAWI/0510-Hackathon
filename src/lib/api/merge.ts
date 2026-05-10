import type { MergeDecision } from '@/types';
import { get, post } from './client';

const PATHS = {
  run: 'integration/run',
  decisions: 'integration/decisions',
} as const;

export function runIntegration(
  request: { textbook_ids?: string[]; similarity_threshold?: number },
  signal?: AbortSignal,
): Promise<{ candidates_found: number; alignments_confirmed: number; decisions: MergeDecision[]; stats: Record<string, unknown> }> {
  return post(PATHS.run, request, signal);
}

export function getDecisions(
  signal?: AbortSignal,
): Promise<MergeDecision[]> {
  return get<MergeDecision[]>(PATHS.decisions, undefined, signal);
}
