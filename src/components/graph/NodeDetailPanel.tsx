import { X, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NODE_TYPE_COLORS, getBookColor } from "@/lib/constants";
import { useGraphStore } from "@/stores/graph";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphEdge } from "@/types";

const NODE_TYPE_LABELS: Record<string, string> = {
  concept: "概念",
  principle: "原理",
  method: "方法",
  phenomenon: "现象",
  structure: "结构",
  process: "过程",
};

const RELATION_LABELS: Record<string, string> = {
  prerequisite: "前置",
  references: "引用",
  builds_upon: "构建",
  similar_to: "相似",
  part_of: "包含",
  causes: "因果",
  contradicts: "矛盾",
};

const STRENGTH_LABELS: Record<string, string> = {
  required: "必需",
  recommended: "推荐",
  optional: "可选",
};

interface NodeDetailPanelProps {
  /** All graph nodes (to resolve connected edges) */
  nodes: readonly GraphNode[];
  /** All graph edges */
  edges: readonly GraphEdge[];
  /** The selected node ID */
  selectedNodeId: string | null;
  /** Callback to navigate to a connected node */
  onNavigateToNode?: (nodeId: string) => void;
  className?: string;
}

function NodeDetailPanel({
  nodes,
  edges,
  selectedNodeId,
  onNavigateToNode,
  className,
}: NodeDetailPanelProps) {
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!selectedNodeId) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-6 text-sm text-muted-foreground",
          className,
        )}
        data-slot="node-detail-panel"
      >
        点击节点查看详情
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-6 text-sm text-muted-foreground",
          className,
        )}
        data-slot="node-detail-panel"
      >
        节点未找到
      </div>
    );
  }

  const connectedEdges = edges.filter(
    (e) => e.source === selectedNodeId || e.target === selectedNodeId,
  );

  const outEdges = connectedEdges.filter((e) => e.source === selectedNodeId);
  const inEdges = connectedEdges.filter((e) => e.target === selectedNodeId);

  const typeColor = NODE_TYPE_COLORS[node.type] ?? "#71717a";
  const bookColor = getBookColor(node.bookName);

  return (
    <ScrollArea className={className}>
      <div className="flex flex-col gap-4 p-4" data-slot="node-detail-panel">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-3 shrink-0 rounded-full"
              style={{ backgroundColor: bookColor }}
            />
            <h3 className="text-sm font-semibold leading-tight">{node.label}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => selectNode(null)}
          >
            <X />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="gap-1">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: typeColor }}
            />
            {NODE_TYPE_LABELS[node.type] ?? node.type}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="size-3" />
            {node.bookName}
          </Badge>
          <Badge variant="outline">重要性 {node.importance}/10</Badge>
        </div>

        {node.definition && (
          <>
            <Separator />
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">定义</h4>
              <p className="text-sm leading-relaxed">{node.definition}</p>
            </div>
          </>
        )}

        {node.keywords.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
                关键词
              </h4>
              <div className="flex flex-wrap gap-1">
                {node.keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {connectedEdges.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
                关联关系 ({connectedEdges.length})
              </h4>
              <div className="flex flex-col gap-1.5">
                {outEdges.map((edge) => {
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                      onClick={() => onNavigateToNode?.(edge.target)}
                    >
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {RELATION_LABELS[edge.relation] ?? edge.relation}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate">{targetNode?.label ?? edge.target}</span>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                        {STRENGTH_LABELS[edge.strength] ?? edge.strength}
                      </Badge>
                    </button>
                  );
                })}
                {inEdges.map((edge) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                      onClick={() => onNavigateToNode?.(edge.source)}
                    >
                      <span className="truncate">{sourceNode?.label ?? edge.source}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {RELATION_LABELS[edge.relation] ?? edge.relation}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span>本节点</span>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                        {STRENGTH_LABELS[edge.strength] ?? edge.strength}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export { NodeDetailPanel };
export type { NodeDetailPanelProps };
