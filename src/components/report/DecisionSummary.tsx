import { useMemo, useState, useCallback } from "react";
import {
  ArrowUpDown,
  Filter,
  GitMerge,
  ArrowRightLeft,
  Trash2,
  Plus,
  Eye,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/constants";
import type {
  MergeAction,
  OverlapLevel,
  MergeDecision,
} from "@/types";
import type {
  DecisionSummaryData,
  DecisionSortField,
  SortDirection,
} from "@/types/report";

interface DecisionSummaryProps {
  data: DecisionSummaryData;
  isLoading?: boolean;
  className?: string;
}

type FilterAction = MergeAction | "all";

const ACTION_CONFIG: Record<
  MergeAction,
  { icon: LucideIcon; label: string; colorClass: string }
> = {
  merge: { icon: GitMerge, label: "合并", colorClass: "text-emerald-500" },
  keep_both: { icon: ArrowRightLeft, label: "保留双方", colorClass: "text-blue-500" },
  keep_a_remove_b: { icon: Trash2, label: "保留A", colorClass: "text-amber-500" },
  keep_b_remove_a: { icon: Trash2, label: "保留B", colorClass: "text-amber-500" },
  add: { icon: Plus, label: "新增", colorClass: "text-blue-500" },
  review: { icon: Eye, label: "待审核", colorClass: "text-red-500" },
};

const FILTER_OPTIONS: Array<{ value: FilterAction; label: string; countKey: keyof DecisionSummaryData["actionCounts"] | null }> = [
  { value: "all", label: "全部", countKey: null },
  { value: "merge", label: "合并", countKey: "merged" },
  { value: "keep_both", label: "保留双方", countKey: "keptBoth" },
  { value: "keep_a_remove_b", label: "保留A", countKey: "keptARemovedB" },
  { value: "keep_b_remove_a", label: "保留B", countKey: "keptBRemovedA" },
  { value: "add", label: "新增", countKey: "added" },
  { value: "review", label: "待审核", countKey: "review" },
];

const SORT_OPTIONS: Array<{ value: DecisionSortField; label: string }> = [
  { value: "confidence", label: "置信度" },
  { value: "overlapLevel", label: "重叠度" },
  { value: "createdAt", label: "时间" },
];

const OVERLAP_ORDER: Record<OverlapLevel, number> = { 高: 3, 中: 2, 低: 1 };

function compareDecisions(
  a: MergeDecision,
  b: MergeDecision,
  field: DecisionSortField,
  direction: SortDirection,
): number {
  const dir = direction === "asc" ? 1 : -1;

  switch (field) {
    case "confidence":
      return (a.confidence - b.confidence) * dir;
    case "overlapLevel":
      return (OVERLAP_ORDER[a.overlapLevel] - OVERLAP_ORDER[b.overlapLevel]) * dir;
    case "createdAt":
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    case "action":
      return a.action.localeCompare(b.action) * dir;
    default:
      return 0;
  }
}

function DecisionSummary({ data, isLoading, className }: DecisionSummaryProps) {
  const [filter, setFilter] = useState<FilterAction>("all");
  const [sortField, setSortField] = useState<DecisionSortField>("confidence");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSort = useCallback(
    (field: DecisionSortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField],
  );

  const filtered = useMemo(() => {
    let result = [...data.decisions];

    if (filter !== "all") {
      result = result.filter((d) => d.action === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.reason.toLowerCase().includes(q) ||
          d.sourceUnitIds.some((id) => id.toLowerCase().includes(q)) ||
          (d.targetUnitId?.toLowerCase().includes(q) ?? false),
      );
    }

    result.sort((a, b) => compareDecisions(a, b, sortField, sortDir));
    return result;
  }, [data.decisions, filter, searchQuery, sortField, sortDir]);

  if (isLoading) {
    return (
      <Card className={cn("gap-4", className)} data-slot="decision-summary">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-0", className)} data-slot="decision-summary">
      <CardHeader className="gap-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4" />
            <span>决策摘要</span>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {data.totalDecisions}
          </Badge>
        </CardTitle>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-emerald-500">
              {data.actionCounts.merged}
            </p>
            <span className="text-muted-foreground">合并</span>
          </div>
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-blue-500">
              {data.actionCounts.keptBoth + data.actionCounts.added}
            </p>
            <span className="text-muted-foreground">保留</span>
          </div>
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-red-500">
              {data.actionCounts.keptARemovedB + data.actionCounts.keptBRemovedA}
            </p>
            <span className="text-muted-foreground">移除</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>平均置信度</span>
          <Progress value={data.avgConfidence * 100} className="h-1.5 flex-1" />
          <span className="font-medium tabular-nums">
            {formatPercentage(data.avgConfidence)}
          </span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="gap-4 px-4 py-4">
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
              {opt.countKey !== null && (
                <span className="tabular-nums text-[10px] opacity-60">
                  {data.actionCounts[opt.countKey]}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索决策..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="xs"
                variant={sortField === opt.value ? "secondary" : "ghost"}
                className="h-6 gap-0.5 px-1.5 text-[10px]"
                onClick={() => toggleSort(opt.value)}
              >
                {opt.label}
                {sortField === opt.value && (
                  <ArrowUpDown
                    className={cn(
                      "size-2.5 transition-transform",
                      sortDir === "asc" && "rotate-180",
                    )}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Filter className="size-6 opacity-40" />
            <p className="text-xs">暂无匹配的决策</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="flex flex-col gap-2 pr-3">
              {filtered.map((decision) => {
                const config = ACTION_CONFIG[decision.action];
                const ActionIcon = config.icon;

                return (
                  <div
                    key={decision.id}
                    className="flex items-start gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <Badge
                      variant={
                        decision.action === "merge"
                          ? "default"
                          : decision.action === "review"
                            ? "destructive"
                            : "secondary"
                      }
                      className="mt-0.5 shrink-0 gap-1"
                    >
                      <ActionIcon className="size-2.5" />
                      {config.label}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-foreground/80">
                        {decision.reason}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>置信度 {formatPercentage(decision.confidence)}</span>
                        <span>重叠 {decision.overlapLevel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function ListChecks({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

export { DecisionSummary };
export type { DecisionSummaryProps };
