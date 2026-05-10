/**
 * 知识图谱颜色常量
 * 基于教材来源、关系类型、整合状态的语义化配色方案
 */

import type { RelationType, NodeType } from '@/types/graph';

/** 教材来源颜色 - 7种高对比度色板 */
export const BOOK_COLORS = [
  '#2563eb', // 蓝
  '#dc2626', // 红
  '#16a34a', // 绿
  '#9333ea', // 紫
  '#ea580c', // 橙
  '#0891b2', // 青
  '#ca8a04', // 黄
] as const;

/** 教材颜色映射（按教材名称索引） */
export const BOOK_COLOR_MAP = new Map<string, string>();

/**
 * 获取教材颜色（自动分配）
 * @param bookName - 教材名称
 * @returns 对应的颜色值
 */
export function getBookColor(bookName: string): string {
  if (!BOOK_COLOR_MAP.has(bookName)) {
    const colorIndex = BOOK_COLOR_MAP.size % BOOK_COLORS.length;
    BOOK_COLOR_MAP.set(bookName, BOOK_COLORS[colorIndex] ?? '#6b7280');
  }
  return BOOK_COLOR_MAP.get(bookName) ?? '#6b7280';
}

/** 关系类型颜色 - 6种语义化色板 */
export const EDGE_COLORS: Record<RelationType, string> = {
  prerequisite: '#dc2626', // 红色 - 前置关系（重要）
  references: '#2563eb',   // 蓝色 - 引用关系
  builds_upon: '#16a34a',  // 绿色 - 构建关系
  similar_to: '#9333ea',   // 紫色 - 相似关系
  part_of: '#ea580c',      // 橙色 - 包含关系
  causes: '#0891b2',       // 青色 - 因果关系
  contradicts: '#be123c',  // 深红 - 矛盾关系
} as const;

/** 整合状态颜色 - 4种状态指示色 */
export const MERGE_COLORS = {
  merged: '#16a34a',      // 绿色 - 已合并
  kept: '#2563eb',        // 蓝色 - 保留
  removed: '#dc2626',     // 红色 - 已移除
  pending: '#ca8a04',     // 黄色 - 待处理
} as const;

/** 节点类型颜色 */
export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  concept: '#2563eb',     // 蓝色 - 概念
  principle: '#9333ea',   // 紫色 - 原理
  method: '#16a34a',      // 绿色 - 方法
  phenomenon: '#ea580c',  // 橙色 - 现象
  structure: '#0891b2',   // 青色 - 结构
  process: '#ca8a04',     // 黄色 - 过程
} as const;

/** 节点重要性透明度映射 */
export const IMPORTANCE_OPACITY: Record<number, number> = {
  1: 0.4,
  2: 0.5,
  3: 0.6,
  4: 0.7,
  5: 0.8,
  6: 0.85,
  7: 0.9,
  8: 0.95,
  9: 1.0,
  10: 1.0,
} as const;

/** 依赖强度样式 */
export const DEPENDENCY_STYLES = {
  required: { color: '#dc2626', lineWidth: 2, dash: [] as number[] },
  recommended: { color: '#2563eb', lineWidth: 1.5, dash: [] as number[] },
  optional: { color: '#71717a', lineWidth: 1, dash: [5, 5] as number[] },
} as const;
