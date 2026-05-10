export type MergeAction =
  | "merge"
  | "keep_both"
  | "keep_a_remove_b"
  | "keep_b_remove_a"
  | "add"
  | "review";

export type OverlapLevel = "高" | "中" | "低";

export interface MergeDecision {
  readonly id: string;
  readonly action: MergeAction;
  readonly sourceUnitIds: readonly string[];
  readonly targetUnitId: string | null;
  readonly reason: string;
  readonly confidence: number;
  readonly overlapLevel: OverlapLevel;
  readonly hasComplementary: boolean;
  readonly complementarySummary: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DuplicatePair {
  readonly unitAId: string;
  readonly unitBId: string;
  readonly similarity: number;
  readonly nameMatch: number;
  readonly isSameConcept: boolean;
  readonly overlapLevel: OverlapLevel;
  readonly recommendedAction: MergeAction;
}

export interface CompressionStats {
  readonly originalCharCount: number;
  readonly finalCharCount: number;
  readonly ratio: number;
  readonly reduction: number;
  readonly mode: "strict" | "normalized";
  readonly removedUnitCount: number;
  readonly mergedUnitCount: number;
  readonly preservedUnitCount: number;
}

export interface CompressionStrategy {
  readonly name: "dedup_only" | "dedup_and_simplify" | "full_compression";
  readonly description: string;
  readonly expectedReduction: string;
}

export interface ImportanceScore {
  readonly unitId: string;
  readonly foundationScore: number;
  readonly clinicalScore: number;
  readonly examScore: number;
  readonly uniqueScore: number;
  readonly overallImportance: number;
  readonly reason: string;
}

export interface DecisionVersion {
  readonly id: number;
  readonly timestamp: string;
  readonly description: string;
  readonly decisions: readonly MergeDecision[];
}

export interface DecisionDiff {
  readonly added: readonly MergeDecision[];
  readonly removed: readonly MergeDecision[];
  readonly modified: readonly DecisionDiffItem[];
}

export interface DecisionDiffItem {
  readonly old: MergeDecision;
  readonly new: MergeDecision;
}

export interface AlignmentCandidate {
  readonly unitAId: string;
  readonly unitBId: string;
  readonly score: number;
  readonly action: "merge" | "review" | "add";
}

export interface DuplicateJudgment {
  readonly isSameConcept: boolean;
  readonly overlapLevel: OverlapLevel;
  readonly hasComplementary: boolean;
  readonly complementarySummary: string;
  readonly recommendedAction: MergeAction;
  readonly reason: string;
  readonly confidence: number;
}

// ─── 兼容别名与 API 请求/响应 ──────────────────────────────

/** @deprecated 使用 DuplicatePair 代替 */
export type MergeCandidate = DuplicatePair;

export interface MergeRequest {
  readonly decisions: readonly MergeDecision[];
  readonly dryRun: boolean;
}

export interface MergeResult {
  readonly taskId: string | null;
  readonly preview: CompressionStats;
  readonly affectedUnits: readonly string[];
}
