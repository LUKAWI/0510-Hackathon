import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercentage } from "@/lib/constants";
import type { CompressionStats as CompressionStatsType } from "@/types";

interface CompressionStatsProps {
  stats: CompressionStatsType;
  className?: string;
}

const RING_SIZE = 120;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type CompressionLevel = "good" | "warning" | "exceeded";

function getCompressionLevel(ratio: number): CompressionLevel {
  if (ratio <= 0.3) return "good";
  if (ratio <= 0.35) return "warning";
  return "exceeded";
}

const LEVEL_CONFIG: Record<
  CompressionLevel,
  { color: string; bgColor: string; label: string }
> = {
  good: {
    color: "text-emerald-500",
    bgColor: "stroke-emerald-500",
    label: "达标",
  },
  warning: {
    color: "text-amber-500",
    bgColor: "stroke-amber-500",
    label: "接近",
  },
  exceeded: {
    color: "text-red-500",
    bgColor: "stroke-red-500",
    label: "超标",
  },
};

function CompressionStats({ stats, className }: CompressionStatsProps) {
  const level = getCompressionLevel(stats.ratio);
  const config = LEVEL_CONFIG[level];

  const ringOffset = useMemo(() => {
    const progress = Math.min(stats.ratio, 1);
    return RING_CIRCUMFERENCE * (1 - progress);
  }, [stats.ratio]);

  return (
    <Card className={cn("gap-4", className)} data-slot="compression-stats">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>压缩比统计</span>
          <Badge
            variant={level === "exceeded" ? "destructive" : level === "warning" ? "secondary" : "default"}
          >
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="shrink-0 -rotate-90"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-muted"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className={cn("transition-all duration-700 ease-out", config.bgColor)}
            />
          </svg>

          <div className="flex flex-1 flex-col gap-4">
            <div className="text-center">
              <span className={cn("text-3xl font-bold tabular-nums", config.color)}>
                {formatPercentage(stats.ratio)}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                压缩率（目标 ≤ 30%）
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                <span className="text-muted-foreground">原始</span>
                <p className="font-medium tabular-nums">
                  {formatNumber(stats.originalCharCount)} 字
                </p>
              </div>
              <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                <span className="text-muted-foreground">整合后</span>
                <p className="font-medium tabular-nums">
                  {formatNumber(stats.finalCharCount)} 字
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {stats.reduction > 0 ? (
                <TrendingDown className="size-3 text-emerald-500" />
              ) : stats.reduction < 0 ? (
                <TrendingUp className="size-3 text-red-500" />
              ) : (
                <Minus className="size-3" />
              )}
              <span>
                减少 {formatNumber(Math.abs(stats.originalCharCount - stats.finalCharCount))} 字
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-emerald-500">
              {stats.mergedUnitCount}
            </p>
            <span className="text-muted-foreground">已合并</span>
          </div>
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-blue-500">
              {stats.preservedUnitCount}
            </p>
            <span className="text-muted-foreground">已保留</span>
          </div>
          <div className="rounded-md border border-border px-2 py-1.5">
            <p className="font-semibold tabular-nums text-red-500">
              {stats.removedUnitCount}
            </p>
            <span className="text-muted-foreground">已移除</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { CompressionStats };
export type { CompressionStatsProps };
