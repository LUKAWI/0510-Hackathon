/**
 * 整合报告类型定义
 *
 * 覆盖报告概览、决策摘要、图谱统计、典型案例等整合报告模块的核心业务实体。
 */

import type { CompressionStats, MergeAction, MergeDecision, OverlapLevel } from "./merge";
import type { NodeType, RelationType } from "./graph";

// ─── 报告概览 ────────────────────────────────────────────

/** 报告概览统计 */
export interface ReportOverviewStats {
  /** 原始教材数量 */
  readonly textbookCount: number;
  /** 原始总字数 */
  readonly originalCharCount: number;
  /** 整合后总字数 */
  readonly finalCharCount: number;
  /** 压缩比 0-1 */
  readonly compressionRatio: number;
  /** 原始知识单元数 */
  readonly originalUnitCount: number;
  /** 整合后知识单元数 */
  readonly finalUnitCount: number;
  /** 处理耗时（秒） */
  readonly processingDuration: number;
}

// ─── 决策摘要 ────────────────────────────────────────────

/** 决策动作统计 */
export interface DecisionActionCounts {
  /** 合并数量 */
  readonly merged: number;
  /** 保留双方数量 */
  readonly keptBoth: number;
  /** 保留A移除B数量 */
  readonly keptARemovedB: number;
  /** 保留B移除A数量 */
  readonly keptBRemovedA: number;
  /** 新增数量 */
  readonly added: number;
  /** 待审核数量 */
  readonly review: number;
}

/** 决策摘要 */
export interface DecisionSummaryData {
  /** 各动作统计 */
  readonly actionCounts: DecisionActionCounts;
  /** 总决策数 */
  readonly totalDecisions: number;
  /** 平均置信度 0-1 */
  readonly avgConfidence: number;
  /** 高重叠度决策数 */
  readonly highOverlapCount: number;
  /** 有互补内容的决策数 */
  readonly complementaryCount: number;
  /** 决策列表 */
  readonly decisions: readonly MergeDecision[];
}

// ─── 图谱统计对比 ─────────────────────────────────────────

/** 图谱快照（整合前或整合后） */
export interface GraphSnapshot {
  /** 节点总数 */
  readonly totalNodes: number;
  /** 边总数 */
  readonly totalEdges: number;
  /** 按节点类型统计 */
  readonly nodesByType: Record<NodeType, number>;
  /** 按关系统计 */
  readonly edgesByType: Record<RelationType, number>;
  /** 平均每节点连接数 */
  readonly avgConnectionsPerNode: number;
}

/** 图谱变化量 */
export interface GraphDelta {
  /** 节点变化量（正=增加，负=减少） */
  readonly nodeChange: number;
  /** 边变化量 */
  readonly edgeChange: number;
  /** 节点变化百分比 0-1 */
  readonly nodeChangePercent: number;
  /** 边变化百分比 0-1 */
  readonly edgeChangePercent: number;
}

/** 图谱统计对比 */
export interface GraphComparison {
  /** 整合前快照 */
  readonly before: GraphSnapshot;
  /** 整合后快照 */
  readonly after: GraphSnapshot;
  /** 变化量 */
  readonly delta: GraphDelta;
}

// ─── 典型案例 ────────────────────────────────────────────

/** 案例涉及的教材来源 */
export interface CaseStudySource {
  /** 教材名称 */
  readonly bookName: string;
  /** 章节名称 */
  readonly chapterName: string;
  /** 知识单元名称 */
  readonly unitName: string;
  /** 知识单元ID */
  readonly unitId: string;
}

/** 典型整合案例 */
export interface CaseStudy {
  /** 案例ID */
  readonly id: string;
  /** 案例标题 */
  readonly title: string;
  /** 整合决策类型 */
  readonly action: MergeAction;
  /** 重叠等级 */
  readonly overlapLevel: OverlapLevel;
  /** 置信度 0-1 */
  readonly confidence: number;
  /** 涉及的知识单元来源 */
  readonly sources: readonly CaseStudySource[];
  /** 决策理由 */
  readonly reason: string;
  /** 互补内容摘要（如有） */
  readonly complementarySummary: string | null;
  /** 整合前内容片段 */
  readonly beforeSnippets: readonly string[];
  /** 整合后内容片段 */
  readonly afterSnippet: string | null;
}

// ─── 完整报告 ────────────────────────────────────────────

/** 完整整合报告 */
export interface FullIntegrationReport {
  /** 报告ID */
  readonly id: string;
  /** 报告标题 */
  readonly title: string;
  /** 涉及教材ID列表 */
  readonly textbookIds: readonly string[];
  /** 报告概览 */
  readonly overview: ReportOverviewStats;
  /** 压缩统计 */
  readonly compressionStats: CompressionStats;
  /** 决策摘要 */
  readonly decisionSummary: DecisionSummaryData;
  /** 图谱统计对比 */
  readonly graphComparison: GraphComparison;
  /** 典型案例 */
  readonly caseStudies: readonly CaseStudy[];
  /** 生成时间 */
  readonly createdAt: string;
}

// ─── 排序与筛选 ────────────────────────────────────────────

/** 决策排序字段 */
export type DecisionSortField = "confidence" | "overlapLevel" | "action" | "createdAt";

/** 排序方向 */
export type SortDirection = "asc" | "desc";

/** 决策筛选条件 */
export interface DecisionFilter {
  /** 按动作筛选 */
  readonly action: MergeAction | "all";
  /** 按重叠度筛选 */
  readonly overlapLevel: OverlapLevel | "all";
  /** 最低置信度 0-1 */
  readonly minConfidence: number;
  /** 搜索关键词 */
  readonly searchQuery: string;
}

/** 决策排序条件 */
export interface DecisionSort {
  readonly field: DecisionSortField;
  readonly direction: SortDirection;
}
