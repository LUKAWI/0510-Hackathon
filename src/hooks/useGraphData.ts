import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMergedGraph } from "@/lib/api/graph";
import { queryKeys } from "@/lib/query/keys";
import type {
  GraphNode,
  GraphEdge,
  NodeType,
  RelationType,
  DependencyStrength,
} from "@/types";

// ─── Types ────────────────────────────────────────────────

/** API 原始返回的节点数据（字段可能为 snake_case 或缺失） */
type RawNode = Record<string, unknown>;

/** API 原始返回的边数据（字段可能缺失） */
type RawEdge = Record<string, unknown>;

/** getMerggedGraph 的运行时数据结构 */
interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
}

interface UseGraphDataResult {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ─── Normalizers ──────────────────────────────────────────

const DEFAULT_NODE_TYPE: NodeType = "concept";
const DEFAULT_EDGE_RELATION: RelationType = "references";
const DEFAULT_STRENGTH: DependencyStrength = "recommended";
const DEFAULT_CONFIDENCE = 0.8;
const DEFAULT_IMPORTANCE = 5;

/** 优先取 camelCase，其次 snake_case */
function pick<T>(raw: RawNode, camel: string, snake: string, fallback: T): T {
  const value = raw[camel] ?? raw[snake];
  return (value != null ? value : fallback) as T;
}

function normalizeNode(raw: RawNode): GraphNode {
  const textbookId = String(pick(raw, "textbookId", "textbook_id", ""));
  const bookName = String(
    pick(raw, "bookName", "book_name", textbookId || ""),
  );

  const rawKeywords = raw.keywords ?? raw["keywords"];
  const keywords: readonly string[] = Array.isArray(rawKeywords)
    ? (rawKeywords as string[])
    : [];

  const rawProperties = raw.properties ?? raw["properties"];
  const properties: Record<string, unknown> =
    typeof rawProperties === "object" && rawProperties !== null
      ? (rawProperties as Record<string, unknown>)
      : {};

  return {
    id: String(raw.id ?? raw["id"] ?? ""),
    label: String(raw.label ?? raw["label"] ?? ""),
    type: (raw.type as NodeType) ?? (raw["type"] as NodeType) ?? DEFAULT_NODE_TYPE,
    definition: String(raw.definition ?? raw["definition"] ?? ""),
    importance: Number(raw.importance ?? raw["importance"] ?? DEFAULT_IMPORTANCE),
    keywords,
    textbookId,
    bookName,
    unitId:
      raw.unitId != null
        ? String(raw.unitId)
        : raw["unit_id"] != null
          ? String(raw["unit_id"])
          : null,
    properties,
  };
}

function normalizeEdge(raw: RawEdge): GraphEdge {
  const source = String(raw.source ?? raw["source"] ?? "");
  const target = String(raw.target ?? raw["target"] ?? "");
  const relation = String(
    raw.relation ?? raw["relation"] ?? DEFAULT_EDGE_RELATION,
  );

  const rawProperties = raw.properties ?? raw["properties"];
  const properties: Record<string, unknown> =
    typeof rawProperties === "object" && rawProperties !== null
      ? (rawProperties as Record<string, unknown>)
      : {};

  return {
    id:
      raw.id != null
        ? String(raw.id)
        : raw["id"] != null
          ? String(raw["id"])
          : `${source}-${target}-${relation}`,
    source,
    target,
    relation: relation as RelationType,
    description: String(raw.description ?? raw["description"] ?? ""),
    strength:
      (raw.strength as DependencyStrength) ??
      (raw["strength"] as DependencyStrength) ??
      DEFAULT_STRENGTH,
    confidence: Number(raw.confidence ?? raw["confidence"] ?? DEFAULT_CONFIDENCE),
    properties,
  };
}

// ─── Hook ─────────────────────────────────────────────────

export function useGraphData(): UseGraphDataResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.graph.all,
    queryFn: ({ signal }) => getMergedGraph(signal),
    staleTime: 30_000,
  });

  const normalized = useMemo(() => {
    const raw = data as unknown as RawGraphData | undefined;
    return {
      nodes: (raw?.nodes ?? []).map(normalizeNode),
      edges: (raw?.edges ?? []).map(normalizeEdge),
    };
  }, [data]);

  return {
    nodes: normalized.nodes,
    edges: normalized.edges,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
