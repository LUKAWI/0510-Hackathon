import {
  FileText,
  BookOpen,
  AlignLeft,
  TrendingDown,
  Layers,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercentage } from "@/lib/constants";
import type { ReportOverviewStats } from "@/types/report";

interface ReportOverviewProps {
  data: ReportOverviewStats;
  isLoading?: boolean;
  className?: string;
}

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  colorClass?: string;
}

function StatItem({ icon: Icon, label, value, subValue, colorClass }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className={cn("size-4", colorClass ?? "text-muted-foreground")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function ReportOverview({ data, isLoading, className }: ReportOverviewProps) {
  if (isLoading) {
    return (
      <Card className={cn("gap-4", className)} data-slot="report-overview">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const reduction = data.originalCharCount - data.finalCharCount;
  const compressionPercent = data.compressionRatio * 100;

  return (
    <Card className={cn("gap-0", className)} data-slot="report-overview">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FileText className="size-4" />
            <span>报告概览</span>
          </div>
          <Badge
            variant={data.compressionRatio <= 0.3 ? "default" : data.compressionRatio <= 0.35 ? "secondary" : "destructive"}
          >
            {data.compressionRatio <= 0.3 ? "达标" : data.compressionRatio <= 0.35 ? "接近" : "超标"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="relative size-20 shrink-0">
            <svg
              width={80}
              height={80}
              viewBox="0 0 80 80"
              className="-rotate-90"
            >
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                strokeWidth={6}
                className="stroke-muted"
              />
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                strokeWidth={6}
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - data.compressionRatio)}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-700 ease-out",
                  data.compressionRatio <= 0.3
                    ? "stroke-emerald-500"
                    : data.compressionRatio <= 0.35
                      ? "stroke-amber-500"
                      : "stroke-red-500",
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  data.compressionRatio <= 0.3
                    ? "text-emerald-500"
                    : data.compressionRatio <= 0.35
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              >
                {formatPercentage(data.compressionRatio)}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">压缩率</span>
              <span className="text-xs text-muted-foreground">目标 ≤ 30%</span>
            </div>
            <Progress
              value={compressionPercent}
              className="h-2"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="size-3 text-emerald-500" />
              <span>
                减少 <span className="font-medium tabular-nums">{formatNumber(reduction)}</span> 字
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatItem
            icon={BookOpen}
            label="教材数量"
            value={`${data.textbookCount} 本`}
            colorClass="text-blue-500"
          />
          <StatItem
            icon={AlignLeft}
            label="原始总字数"
            value={`${formatNumber(data.originalCharCount)} 字`}
            colorClass="text-foreground"
          />
          <StatItem
            icon={Layers}
            label="知识单元"
            value={`${formatNumber(data.originalUnitCount)} → ${formatNumber(data.finalUnitCount)}`}
            subValue={`减少 ${formatNumber(data.originalUnitCount - data.finalUnitCount)} 个`}
            colorClass="text-emerald-500"
          />
          <StatItem
            icon={Clock}
            label="处理耗时"
            value={`${data.processingDuration}s`}
            colorClass="text-muted-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { ReportOverview };
export type { ReportOverviewProps };
