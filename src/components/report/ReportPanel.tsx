import {
  ScrollText,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/constants";
import { ReportOverview } from "./ReportOverview";
import { DecisionSummary } from "./DecisionSummary";
import { GraphStats } from "./GraphStats";
import { CaseStudies } from "./CaseStudies";
import { useReports, useGenerateReport } from "@/hooks/useReport";

interface ReportPanelProps {
  className?: string;
}

function ReportPanel({ className }: ReportPanelProps) {
  const { data: report, isLoading, isError, refetch } = useReports();
  const generateMutation = useGenerateReport();

  const handleGenerate = () => {
    generateMutation.mutate({ textbook_ids: undefined });
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-4 p-4", className)} data-slot="report-panel">
        <Card className="gap-0">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </CardContent>
        </Card>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className={cn("flex flex-col gap-4 p-4", className)} data-slot="report-panel">
        <Card className="gap-4">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <ScrollText className="size-12 text-muted-foreground/40" />
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium">暂无整合报告</p>
              <p className="text-xs text-muted-foreground">
                执行知识整合后将自动生成报告
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              生成报告
            </Button>
            {generateMutation.isError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>生成失败，请重试</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)} data-slot="report-panel">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="size-4" />
            <span className="text-sm font-medium">整合报告</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {formatDate(report?.createdAt ?? "", "long")}
            </Badge>
            <Button
              size="icon-xs"
              variant="ghost"
              className="size-6"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {report && <ReportOverview data={report.overview} />}

        {report && <DecisionSummary data={report.decisionSummary} />}

        {report && <GraphStats data={report.graphComparison} />}

        {report && <CaseStudies caseStudies={report.caseStudies} />}
      </div>
    </ScrollArea>
  );
}

export { ReportPanel };
export type { ReportPanelProps };
