import type { FullIntegrationReport } from '@/types';
import { get, post, put, del } from './client';

const PATHS = {
  list: 'report/list',
  report: (id: string) => `report/${id}`,
  generate: 'report/generate',
  download: (id: string) => `report/${id}/download`,
} as const;

export function listReports(
  signal?: AbortSignal,
): Promise<FullIntegrationReport[]> {
  return get<FullIntegrationReport[]>(PATHS.list, undefined, signal);
}

export function getReport(
  id: string,
  signal?: AbortSignal,
): Promise<{ id: string; title: string; content: string; stats: Record<string, unknown>; created_at: string; updated_at: string }> {
  return get(PATHS.report(id), undefined, signal);
}

export function generateReport(
  request: { textbook_ids?: string[] },
  signal?: AbortSignal,
): Promise<{ id: string; title: string; content: string; stats: Record<string, unknown> }> {
  return post(PATHS.generate, request, signal);
}

export function updateReport(
  id: string,
  request: { title?: string; content?: string },
  signal?: AbortSignal,
): Promise<{ id: string; title: string; content: string; stats: Record<string, unknown> }> {
  return put(PATHS.report(id), request, signal);
}

export function deleteReport(
  id: string,
  signal?: AbortSignal,
): Promise<{ message: string; id: string }> {
  return del(PATHS.report(id), undefined, signal);
}

export function downloadReport(
  id: string,
  format: 'md' | 'txt' = 'md',
  signal?: AbortSignal,
): Promise<string> {
  return get(PATHS.download(id), { format }, signal);
}
