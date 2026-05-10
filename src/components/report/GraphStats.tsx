import { useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  GitBranch,
  Network,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercentage } from "@/lib/constants";
import type { GraphComparison } from "@/types/report";
import type { NodeType, RelationType } from "@/types";

interface GraphStatsProps {
  data: GraphComparison;
  isLoading?: boolean;
  className?: string;
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  concept: "概念",
  principle: "原理",
  method: "方法",
  phenomenon: "现象",
  structure: "结构",
  process: "过程",
};

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  concept: "text-blue-500",
  principle: "text-purple-500",
  method: "text-emerald-500",
  phenomenon: "text-orange-500",
  structure: "text-cyan-500",
  process: "text-yellow-500",
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

function ChangeIndicator({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
        <span>无变化</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs",
        isPositive ? "text-emerald-500" : "text-red-500",
      )}
    >
      <Icon className="size-3" />
      <span className="tabular-nums">
        {isPositive ? "+" : ""}
        {formatNumber(value)}
        {suffix}
      </span>
    </span>
  );
}

function StatComparison({
  label,
  before,
  after,
  icon: Icon,
}: {
  label: string;
  before: number;
  after: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const change = after - before;
  const changePercent = before > 0 ? change / before : 0;

  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-muted-foreground line-through">
          {formatNumber(before)}
        </span>
        <span className="text-xs text-muted-foreground">→</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatNumber(after)}
        </span>
        <ChangeIndicator value={change} />
        {changePercent !== 0 && (
          <Badge
            variant={change < 0 ? "default" : "secondary"}
            className="text-[10px] tabular-nums"
          >
            {changePercent > 0 ? "+" : ""}
            {formatPercentage(changePercent, { isNormalized: false })}
          </Badge>
        )}
      </div>
    </div>
  );
}

function TypeBreakdown({
  title,
  before,
  after,
  labels,
  colorMap,
}: {
  title: string;
  before: Record<string, number>;
  after: Record<string, number>;
  labels: Record<string, string>;
  colorMap: Record<string, string>;
}) {
  const allKeys = useMemo(() => {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].sort((a, b) => (after[b] ?? 0) - (after[a] ?? 0));
  }, [before, after]);

  const maxVal = useMemo(() => {
    return Math.max(
      ...allKeys.map((k) => Math.max(before[k] ?? 0, after[k] ?? 0)),
      1,
    );
  }, [allKeys, before, after]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="flex flex-col gap-1.5">
        {allKeys.map((key) => {
          const b = before[key] ?? 0;
          const a = after[key] ?? 0;
          const change = a - b;

          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "w-10 shrink-0 text-right font-medium",
                  colorMap[key] ?? "text-foreground",
                )}
              >
                {labels[key] ?? key}
              </span>
              <div className="flex flex-1 items-center gap-1">
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
                    style={{ width: `${(b / maxVal) * 100}%` }}
                  />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      change >= 0 ? "bg-emerald-500" : "bg-red-500",
                    )}
                    style={{ width: `${(a / maxVal) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{a}</span>
              </div>
              <ChangeIndicator value={change} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraphStats({ data, isLoading, className }: GraphStatsProps) {
  if (isLoading) {
    return (
      <Card className={cn("gap-4", className)} data-slot="graph-stats">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-0", className)} data-slot="graph-stats">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Network className="size-4" />
            <span>图谱统计</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            整合前后对比
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="gap-4 px-4 py-3">
        <div className="flex flex-col gap-2">
          <StatComparison
            label="节点"
            before={data.before.totalNodes}
            after={data.after.totalNodes}
            icon={GitBranch}
          />
          <StatComparison
            label="关系"
            before={data.before.totalEdges}
            after={data.after.totalEdges}
            icon={Network}
          />
          <StatComparison
            label="平均连接"
            before={Math.round(data.before.avgConnectionsPerNode * 10) / 10}
            after={Math.round(data.after.avgConnectionsPerNode * 10) / 10}
            icon={GitBranch}
          />
        </div>

        <Separator />

        <TypeBreakdown
          title="节点类型分布"
          before={data.before.nodesByType}
          after={data.after.nodesByType}
          labels={NODE_TYPE_LABELS}
          colorMap={NODE_TYPE_COLORS}
        />

        <Separator />

        <TypeBreakdown
          title="关系类型分布"
          before={data.before.edgesByType}
          after={data.after.edgesByType}
          labels={RELATION_TYPE_LABELS}
          colorMap={{}}
        />
      </CardContent>
    </Card>
  );
}

export { GraphStats };
export type { GraphStatsProps };
