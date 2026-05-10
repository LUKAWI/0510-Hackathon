import type {
  Textbook,
} from '@/types';
import { del, get, uploadFile } from './client';

const PATHS = {
  list: 'textbooks',
  detail: (id: string) => `textbooks/${id}`,
  delete: (id: string) => `textbooks/${id}`,
  upload: 'textbooks/upload',
} as const;

export function listTextbooks(
  signal?: AbortSignal,
): Promise<Textbook[]> {
  return get<Textbook[]>(PATHS.list, undefined, signal);
}

export function getTextbook(
  id: string,
  signal?: AbortSignal,
): Promise<Textbook> {
  return get<Textbook>(PATHS.detail(id), undefined, signal);
}

export function uploadTextbook(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ task_id: string; textbook_id: string; filename: string; status: string }> {
  return uploadFile(PATHS.upload, file, onProgress);
}

export function deleteTextbook(
  id: string,
  signal?: AbortSignal,
): Promise<{ message: string }> {
  return del<{ message: string }>(PATHS.delete(id), undefined, signal);
}
