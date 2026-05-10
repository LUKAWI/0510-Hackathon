import { BOOK_COLORS, NODE_TYPE_COLORS, EDGE_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NodeType, RelationType } from "@/types";

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  concept: "概念",
  principle: "原理",
  method: "方法",
  phenomenon: "现象",
  structure: "结构",
  process: "过程",
};

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  prerequisite: "前置",
  references: "引用",
  builds_upon: "构建",
  similar_to: "相似",
  part_of: "包含",
  causes: "因果",
  contradicts: "矛盾",
};

interface GraphLegendProps {
  activeBooks?: readonly string[];
  className?: string;
}

function GraphLegend({ activeBooks = [], className }: GraphLegendProps) {
  const bookEntries = activeBooks.length > 0
    ? activeBooks.map((name, i) => ({ name, color: BOOK_COLORS[i % BOOK_COLORS.length]! }))
    : [];

  return (
    <ScrollArea className={cn("max-h-80", className)}>
      <div className="flex flex-col gap-4 p-4" data-slot="graph-legend">
        {bookEntries.length > 0 && (
          <section>
            <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">教材来源</h4>
            <div className="flex flex-col gap-1">
              {bookEntries.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-xs">{entry.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {bookEntries.length > 0 && <Separator />}

        <section>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">节点类型</h4>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(NODE_TYPE_LABELS) as [NodeType, string][]).map(([type, label]) => (
              <Badge
                key={type}
                variant="outline"
                className="gap-1 text-xs"
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                />
                {label}
              </Badge>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">关系类型</h4>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(RELATION_TYPE_LABELS) as [RelationType, string][]).map(([type, label]) => (
              <Badge
                key={type}
                variant="outline"
                className="gap-1 text-xs"
              >
                <span
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: EDGE_COLORS[type] }}
                />
                {label}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}

export { GraphLegend };
export type { GraphLegendProps };
