import type { KnowledgeUnit } from "./textbook";

export type NodeType =
  | "concept"
  | "principle"
  | "method"
  | "phenomenon"
  | "structure"
  | "process";

export type RelationType =
  | "prerequisite"
  | "references"
  | "builds_upon"
  | "similar_to"
  | "part_of"
  | "causes"
  | "contradicts";

export type DependencyStrength = "required" | "recommended" | "optional";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly type: NodeType;
  readonly unitId: string | null;
  readonly textbookId: string;
  readonly bookName: string;
  readonly definition: string;
  readonly importance: number;
  readonly keywords: readonly string[];
  readonly properties: Record<string, unknown>;
}

export interface GraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly relation: RelationType;
  readonly description: string;
  readonly strength: DependencyStrength;
  readonly confidence: number;
  readonly properties: Record<string, unknown>;
}

export interface GraphData {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export interface GraphFilter {
  readonly textbookIds: readonly string[];
  readonly nodeTypes: readonly NodeType[];
  readonly relationTypes: readonly RelationType[];
  readonly minImportance: number;
  readonly searchQuery: string;
}

export interface GraphLayoutOptions {
  readonly type: "force" | "dagre" | "radial" | "circular";
  readonly workerEnabled: boolean;
  readonly gpuEnabled: boolean;
}

export interface GraphStats {
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly nodesByType: Record<NodeType, number>;
  readonly nodesByTextbook: Record<string, number>;
  readonly avgConnectionsPerNode: number;
}

export interface CoherenceViolation {
  readonly nodeId: string;
  readonly nodeName: string;
  readonly brokenPrerequisites: readonly string[];
  readonly severity: number;
}

export interface CoherenceFix {
  readonly nodeId: string;
  readonly options: readonly CoherenceFixOption[];
}

export interface CoherenceFixOption {
  readonly action: "restore" | "add_brief" | "find_alternative";
  readonly targets: readonly string[];
  readonly description: string;
}

export interface KnowledgeDependency {
  readonly source: string;
  readonly target: string;
  readonly relationType: RelationType;
  readonly description: string;
  readonly strength: DependencyStrength;
}

export interface AlignmentResult {
  readonly unitA: KnowledgeUnit;
  readonly unitB: KnowledgeUnit;
  readonly score: number;
  readonly signals: AlignmentSignals;
}

export interface AlignmentSignals {
  readonly nameSimilarity: number;
  readonly definitionSimilarity: number;
  readonly keywordOverlap: number;
  readonly contextSimilarity: number;
}

// ─── 兼容别名与 API 请求/响应 ──────────────────────────────

/** @deprecated 使用 RelationType 代替 */
export type GraphEdgeRelation = RelationType;

/** @deprecated 使用 GraphData 代替 */
export type KnowledgeGraph = GraphData;

export interface GraphBuildRequest {
  readonly textbookIds: readonly string[];
  readonly rebuild: boolean;
}

export interface GraphBuildResponse {
  readonly taskId: string;
  readonly status: string;
}
