import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────

export type RightPanelTab = 'merge' | 'rag' | 'chat' | 'report';

interface LayoutState {
  /** 左侧面板是否折叠 */
  leftPanelCollapsed: boolean;
  /** 右侧面板是否可见 */
  rightPanelVisible: boolean;
  /** 右侧面板当前激活的标签 */
  rightPanelTab: RightPanelTab;
  /** 是否全屏模式 */
  isFullscreen: boolean;
}

interface LayoutActions {
  /** 切换左侧面板折叠/展开 */
  toggleLeftPanel: () => void;
  /** 切换右侧面板显示/隐藏 */
  toggleRightPanel: () => void;
  /** 设置右侧面板激活标签 */
  setRightPanelTab: (tab: RightPanelTab) => void;
  /** 切换全屏模式 */
  toggleFullscreen: () => void;
}

// ─── Store ────────────────────────────────────────────────

export const useLayoutStore = create<LayoutState & LayoutActions>()((set) => ({
  // ── State ──
  leftPanelCollapsed: false,
  rightPanelVisible: true,
  rightPanelTab: 'chat',
  isFullscreen: false,

  // ── Actions ──
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

  toggleRightPanel: () =>
    set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
