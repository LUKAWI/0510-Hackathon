import { useState, useMemo } from "react";
import { Filter, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DecisionCard } from "./DecisionCard";
import { cn } from "@/lib/utils";
import type { MergeAction, MergeDecision } from "@/types";

interface DecisionListProps {
  decisions: readonly MergeDecision[];
  isLoading?: boolean;
  knowledgeNames?: ReadonlyMap<string, string>;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onModify?: (id: string) => void;
  onNavigateToUnit?: (unitId: string) => void;
  onBatchAccept?: (ids: readonly string[]) => void;
  className?: string;
}

type FilterAction = MergeAction | "all";

const FILTER_OPTIONS: Array<{ value: FilterAction; label: string }> = [
  { value: "all", label: "全部" },
  { value: "merge", label: "合并" },
  { value: "keep_both", label: "保留双方" },
  { value: "keep_a_remove_b", label: "保留A" },
  { value: "keep_b_remove_a", label: "保留B" },
  { value: "add", label: "新增" },
  { value: "review", label: "待审核" },
];

function DecisionList({
  decisions,
  isLoading = false,
  knowledgeNames,
  onAccept,
  onReject,
  onModify,
  onNavigateToUnit,
  onBatchAccept,
  className,
}: DecisionListProps) {
  const [filter, setFilter] = useState<FilterAction>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return decisions;
    return decisions.filter((d) => d.action === filter);
  }, [decisions, filter]);

  const actionCounts = useMemo(() => {
    const counts = new Map<MergeAction, number>();
    for (const d of decisions) {
      counts.set(d.action, (counts.get(d.action) ?? 0) + 1);
    }
    return counts;
  }, [decisions]);

  const pendingIds = useMemo(
    () => filtered.filter((d) => d.action === "review").map((d) => d.id),
    [filtered],
  );

  if (isLoading) {
    return (
      <Card className={cn("gap-4", className)} data-slot="decision-list">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-0", className)} data-slot="decision-list">
      <CardHeader className="gap-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4" />
            <span>整合决策</span>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {decisions.length}
          </Badge>
        </CardTitle>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="xs"
              variant={filter === opt.value ? "default" : "ghost"}
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className="tabular-nums text-[10px] opacity-60">
                  {actionCounts.get(opt.value as MergeAction) ?? 0}
                </span>
              )}
            </Button>
          ))}
        </div>

        {pendingIds.length > 0 && onBatchAccept && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pendingIds.length} 条待审核
              </span>
              <Button
                size="xs"
                variant="outline"
                className="gap-1"
                onClick={() => onBatchAccept(pendingIds)}
              >
                <Filter className="size-3" />
                批量接受待审核
              </Button>
            </div>
          </>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <ListChecks className="size-8 opacity-40" />
            <p className="text-sm">
              {filter === "all" ? "暂无整合决策" : "该分类下暂无决策"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="flex flex-col gap-4 pr-3">
              {filtered.map((decision, idx) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  index={idx}
                  knowledgeNames={knowledgeNames}
                  onAccept={onAccept}
                  onReject={onReject}
                  onModify={onModify}
                  onNavigateToUnit={onNavigateToUnit}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export { DecisionList };
export type { DecisionListProps };
