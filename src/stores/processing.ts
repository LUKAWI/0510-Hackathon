import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'extracting'
  | 'building_graph'
  | 'aligning'
  | 'merging'
  | 'indexing'
  | 'done'
  | 'error';

interface ProcessingState {
  /** 当前处理阶段 */
  stage: ProcessingStage;
  /** 处理进度 0-100 */
  progress: number;
  /** 当前正在处理的文件名 */
  currentFile: string | null;
  /** 错误信息（仅 error 阶段有值） */
  error: string | null;
}

interface ProcessingActions {
  /** 设置处理阶段 */
  setStage: (stage: ProcessingStage) => void;
  /** 设置处理进度 (0-100) */
  setProgress: (progress: number) => void;
  /** 设置当前处理的文件名 */
  setCurrentFile: (fileName: string | null) => void;
  /** 设置错误信息（同时将阶段切换为 error） */
  setError: (error: string) => void;
  /** 重置为初始状态 */
  reset: () => void;
}

// ─── Defaults ─────────────────────────────────────────────

const initialState: ProcessingState = {
  stage: 'idle',
  progress: 0,
  currentFile: null,
  error: null,
};

// ─── Store ────────────────────────────────────────────────

export const useProcessingStore = create<ProcessingState & ProcessingActions>()(
  (set) => ({
    // ── State ──
    ...initialState,

    // ── Actions ──
    setStage: (stage) => set({ stage }),

    setProgress: (progress) =>
      set({ progress: Math.max(0, Math.min(100, progress)) }),

    setCurrentFile: (fileName) => set({ currentFile: fileName }),

    setError: (error) => set({ stage: 'error', error }),

    reset: () => set({ ...initialState }),
  }),
);
