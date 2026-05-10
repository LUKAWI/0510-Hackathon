import { create } from 'zustand';

import type { GraphEdgeRelation } from '@/types';

// ─── Types ────────────────────────────────────────────────

export type GraphViewMode = 'force' | 'tree' | 'radial' | 'grid';

export interface GraphFilters {
  /** 筛选的教材 ID 列表，空数组表示全部 */
  bookIds: string[];
  /** 筛选的关系类型，空数组表示全部 */
  relationTypes: GraphEdgeRelation[];
  /** 重要性范围 [min, max]，值域 0-1 */
  importanceRange: [number, number];
}

interface GraphState {
  /** 当前选中的节点 ID */
  selectedNodeId: string | null;
  /** 高亮的节点 ID 集合 */
  highlightedNodeIds: string[];
  /** 图谱搜索关键词 */
  searchKeyword: string;
  /** 图谱视图布局模式 */
  viewMode: GraphViewMode;
  /** 图谱过滤条件 */
  filters: GraphFilters;
}

interface GraphActions {
  /** 选中节点（传 null 取消选中） */
  selectNode: (nodeId: string | null) => void;
  /** 设置高亮节点集合 */
  highlightNodes: (nodeIds: string[]) => void;
  /** 设置搜索关键词 */
  setSearchKeyword: (keyword: string) => void;
  /** 切换视图布局模式 */
  setViewMode: (mode: GraphViewMode) => void;
  /** 更新过滤条件（部分更新） */
  setFilters: (filters: Partial<GraphFilters>) => void;
  /** 重置所有过滤条件为默认值 */
  resetFilters: () => void;
}

// ─── Defaults ─────────────────────────────────────────────

const defaultFilters: GraphFilters = {
  bookIds: [],
  relationTypes: [],
  importanceRange: [0, 1],
};

// ─── Store ────────────────────────────────────────────────

export const useGraphStore = create<GraphState & GraphActions>()((set) => ({
  // ── State ──
  selectedNodeId: null,
  highlightedNodeIds: [],
  searchKeyword: '',
  viewMode: 'force',
  filters: { ...defaultFilters },

  // ── Actions ──
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  highlightNodes: (nodeIds) => set({ highlightedNodeIds: nodeIds }),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
