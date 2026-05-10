import { useMemo } from "react";
import { ArrowRight, Plus, Minus, Equal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MergeDecision } from "@/types";
import type { KnowledgeUnit } from "@/types";

interface CompareViewProps {
  beforeUnits: readonly KnowledgeUnit[];
  afterUnits: readonly KnowledgeUnit[];
  decisions: readonly MergeDecision[];
  className?: string;
}

interface DiffEntry {
  readonly type: "added" | "removed" | "merged" | "unchanged";
  readonly unit: KnowledgeUnit;
  readonly mergedInto?: string;
}

function buildDiff(
  before: readonly KnowledgeUnit[],
  after: readonly KnowledgeUnit[],
  decisions: readonly MergeDecision[],
): DiffEntry[] {
  const afterIds = new Set(after.map((u) => u.id));
  const beforeIds = new Set(before.map((u) => u.id));

  const mergedSourceIds = new Set<string>();
  for (const d of decisions) {
    if (d.action === "merge") {
      for (const srcId of d.sourceUnitIds) {
        mergedSourceIds.add(srcId);
      }
    }
  }

  const entries: DiffEntry[] = [];

  for (const unit of before) {
    if (mergedSourceIds.has(unit.id)) {
      const decision = decisions.find((d) =>
        d.sourceUnitIds.includes(unit.id) && d.action === "merge",
      );
      entries.push({
        type: "merged",
        unit,
        mergedInto: decision?.targetUnitId ?? undefined,
      });
    } else if (!afterIds.has(unit.id)) {
      entries.push({ type: "removed", unit });
    } else {
      entries.push({ type: "unchanged", unit });
    }
  }

  for (const unit of after) {
    if (!beforeIds.has(unit.id)) {
      entries.push({ type: "added", unit });
    }
  }

  return entries;
}

const TYPE_CONFIG: Record<
  DiffEntry["type"],
  { icon: typeof Plus; color: string; label: string }
> = {
  added: { icon: Plus, color: "text-emerald-500", label: "新增" },
  removed: { icon: Minus, color: "text-red-500", label: "移除" },
  merged: { icon: ArrowRight, color: "text-amber-500", label: "合并" },
  unchanged: { icon: Equal, color: "text-muted-foreground", label: "保留" },
};

function CompareView({
  beforeUnits,
  afterUnits,
  decisions,
  className,
}: CompareViewProps) {
  const diff = useMemo(
    () => buildDiff(beforeUnits, afterUnits, decisions),
    [beforeUnits, afterUnits, decisions],
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let merged = 0;
    let unchanged = 0;
    for (const entry of diff) {
      if (entry.type === "added") added++;
      else if (entry.type === "removed") removed++;
      else if (entry.type === "merged") merged++;
      else unchanged++;
    }
    return { added, removed, merged, unchanged };
  }, [diff]);

  return (
    <Card className={cn("gap-0", className)} data-slot="compare-view">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowRight className="size-4" />
          <span>整合前后对比</span>
        </CardTitle>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground">{beforeUnits.length}</span>
            知识单元
          </span>
          <ArrowRight className="size-3" />
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground">{afterUnits.length}</span>
            知识单元
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Plus className="size-2.5 text-emerald-500" />
              {stats.added}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Minus className="size-2.5 text-red-500" />
              {stats.removed}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <ArrowRight className="size-2.5 text-amber-500" />
              {stats.merged}
            </Badge>
          </span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="px-4 py-4">
        <ScrollArea className="max-h-[400px]">
          <div className="flex flex-col gap-1.5 pr-3">
            {diff.map((entry) => {
              const config = TYPE_CONFIG[entry.type];
              const Icon = config.icon;
              return (
                <div
                  key={`${entry.type}-${entry.unit.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
                    entry.type === "added" && "border-emerald-500/20 bg-emerald-500/5",
                    entry.type === "removed" && "border-red-500/20 bg-red-500/5 line-through opacity-60",
                    entry.type === "merged" && "border-amber-500/20 bg-amber-500/5",
                    entry.type === "unchanged" && "border-border",
                  )}
                >
                  <Icon className={cn("size-3.5 shrink-0", config.color)} />
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px]", config.color)}
                  >
                    {config.label}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {entry.unit.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {entry.unit.bookName}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { CompareView };
export type { CompareViewProps };
