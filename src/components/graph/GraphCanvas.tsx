import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Graph, NodeEvent, type GraphData as G6GraphData } from "@antv/g6";
import { Network } from "lucide-react";

import { useGraphStore } from "@/stores/graph";
import {
  getBookColor,
  EDGE_COLORS,
  DEPENDENCY_STYLES,
} from "@/lib/constants";
import { GraphSkeleton, EmptyState } from "@/components/global/LoadingSkeleton";
import type { GraphNode, GraphEdge } from "@/types";

const MIN_NODE_SIZE = 24;
const MAX_NODE_SIZE = 64;
const MAX_IMPORTANCE = 10;

function importanceToSize(importance: number): number {
  const clamped = Math.max(1, Math.min(MAX_IMPORTANCE, importance));
  return MIN_NODE_SIZE + ((clamped - 1) / (MAX_IMPORTANCE - 1)) * (MAX_NODE_SIZE - MIN_NODE_SIZE);
}

function getEdgeStyle(edge: GraphEdge) {
  const baseColor = EDGE_COLORS[edge.relation] ?? "#71717a";
  const depStyle = DEPENDENCY_STYLES[edge.strength];

  return {
    stroke: baseColor,
    lineWidth: depStyle.lineWidth,
    lineDash: depStyle.dash,
    endArrow: true,
    opacity: Math.max(0.4, edge.confidence),
  };
}

function toG6Data(nodes: readonly GraphNode[], edges: readonly GraphEdge[], isDark: boolean): G6GraphData {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      data: {
        label: n.label,
        type: n.type,
        bookName: n.bookName,
        textbookId: n.textbookId,
        definition: n.definition,
        importance: n.importance,
        keywords: n.keywords,
      },
      style: {
        size: importanceToSize(n.importance),
        fill: getBookColor(n.bookName),
        stroke: "var(--color-border)",
        lineWidth: 2,
        labelText: n.label,
        labelFontSize: 12,
        labelFill: isDark ? "#e2e8f0" : "#0f172a",
        labelPlacement: "bottom" as const,
        labelOffsetY: 4,
        cursor: "pointer",
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: {
        relation: e.relation,
        description: e.description,
        strength: e.strength,
        confidence: e.confidence,
      },
      style: getEdgeStyle(e),
    })),
  };
}

interface G6NodeClickEvent {
  target?: { id?: string };
}

interface GraphCanvasProps {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

function GraphCanvas({ nodes, edges, isLoading = false, onNodeClick, className }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const searchKeyword = useGraphStore((s) => s.searchKeyword);
  const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);

  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const themeColors = useMemo(
    () => ({
      labelFill: isDark ? "#e2e8f0" : "#0f172a",
      selectedStroke: isDark ? "#e2e8f0" : "#18181b",
      highlightStroke: isDark ? "#e2e8f0" : "#18181b",
      shadowColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.25)",
    }),
    [isDark],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      autoResize: true,
      autoFit: "view",
      animation: { duration: 300 },
      layout: {
        type: "force",
        linkDistance: 120,
        nodeStrength: -120,
        edgeStrength: 0.6,
        preventOverlap: true,
        nodeSize: 48,
        workerEnabled: true,
      },
      behaviors: [
        "zoom-canvas",
        "drag-canvas",
        "drag-element",
        {
          type: "click-select",
          state: "selected",
          multiple: false,
        },
      ],
      node: {
        state: {
          selected: {
            stroke: themeColors.selectedStroke,
            lineWidth: 3,
            shadowColor: themeColors.shadowColor,
            shadowBlur: 12,
          },
          highlight: {
            stroke: themeColors.highlightStroke,
            lineWidth: 2,
          },
          dim: {
            opacity: 0.2,
          },
        },
      },
      edge: {
        state: {
          selected: {
            lineWidth: 3,
          },
          dim: {
            opacity: 0.08,
          },
        },
      },
      data: { nodes: [], edges: [] },
    });

    graph.render();
    graphRef.current = graph;

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [themeColors]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const g6Data = toG6Data(nodes, edges, isDark);
    graph.setData(g6Data);
    graph.render();
  }, [nodes, edges, isDark]);

  const handleNodeClick = useCallback(
    (event: G6NodeClickEvent) => {
      const nodeId = event.target?.id;
      if (nodeId) {
        onNodeClick?.(nodeId);
      }
    },
    [onNodeClick],
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    graph.on(NodeEvent.CLICK, handleNodeClick as (event: unknown) => void);
    return () => {
      graph.off(NodeEvent.CLICK, handleNodeClick as (event: unknown) => void);
    };
  }, [handleNodeClick]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graph.destroyed) return;

    const hasSearch = searchKeyword.trim().length > 0;
    const hasHighlights = highlightedNodeIds.length > 0;

    if (!hasSearch && !hasHighlights) {
      const allNodes = graph.getNodeData();
      for (const node of allNodes) {
        graph.setElementState(node.id!, "default");
      }
      const allEdges = graph.getEdgeData();
      for (const edge of allEdges) {
        graph.setElementState(edge.id!, "default");
      }
      return;
    }

    const highlightSet = new Set(highlightedNodeIds);
    const allNodes = graph.getNodeData();

    for (const node of allNodes) {
      const nodeId = node.id!;
      const matchesSearch = hasSearch
        ? (node.data?.label as string)?.toLowerCase().includes(searchKeyword.toLowerCase())
        : true;
      const isHighlighted = hasHighlights ? highlightSet.has(nodeId) : true;

      graph.setElementState(nodeId, matchesSearch && isHighlighted ? "highlight" : "dim");
    }

    const allEdges = graph.getEdgeData();
    for (const edge of allEdges) {
      const src = edge.source!;
      const tgt = edge.target!;
      const connected = highlightSet.has(src) || highlightSet.has(tgt);
      const shouldDimEdge = (hasSearch || hasHighlights) && !connected;
      graph.setElementState(edge.id!, shouldDimEdge ? "dim" : "default");
    }
  }, [searchKeyword, highlightedNodeIds]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const handleZoomIn = () => graph.zoomTo(graph.getZoom() * 1.2);
    const handleZoomOut = () => graph.zoomTo(graph.getZoom() / 1.2);
    const handleZoomFit = () => graph.fitView();
    const handleZoomReset = () => graph.zoomTo(1);

    window.addEventListener("graph:zoom-in", handleZoomIn);
    window.addEventListener("graph:zoom-out", handleZoomOut);
    window.addEventListener("graph:zoom-fit", handleZoomFit);
    window.addEventListener("graph:zoom-reset", handleZoomReset);

    return () => {
      window.removeEventListener("graph:zoom-in", handleZoomIn);
      window.removeEventListener("graph:zoom-out", handleZoomOut);
      window.removeEventListener("graph:zoom-fit", handleZoomFit);
      window.removeEventListener("graph:zoom-reset", handleZoomReset);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={className} data-slot="graph-canvas">
        <GraphSkeleton />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={className} data-slot="graph-canvas">
        <EmptyState
          icon={Network}
          title="暂无知识图谱"
          description="选择教材后构建图谱，即可在此可视化探索"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-slot="graph-canvas"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export { GraphCanvas };
export type { GraphCanvasProps };
