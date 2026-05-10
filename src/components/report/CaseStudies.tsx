import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  GitMerge,
  ArrowRightLeft,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/constants";
import type { MergeAction } from "@/types";
import type { CaseStudy } from "@/types/report";

interface CaseStudiesProps {
  caseStudies: readonly CaseStudy[];
  isLoading?: boolean;
  className?: string;
}

const ACTION_CONFIG: Record<
  MergeAction,
  { icon: LucideIcon; label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  merge: { icon: GitMerge, label: "合并", variant: "default" },
  keep_both: { icon: ArrowRightLeft, label: "保留双方", variant: "secondary" },
  keep_a_remove_b: { icon: Trash2, label: "保留A移除B", variant: "outline" },
  keep_b_remove_a: { icon: Trash2, label: "保留B移除A", variant: "outline" },
  add: { icon: Plus, label: "新增", variant: "secondary" },
  review: { icon: Eye, label: "待审核", variant: "destructive" },
};

const OVERLAP_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  高: "destructive",
  中: "secondary",
  低: "outline",
};

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTION_CONFIG[study.action];
  const ActionIcon = config.icon;

  return (
    <Card className={cn("gap-0 py-0 overflow-hidden")} data-slot="case-study-card">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge variant={config.variant} className="shrink-0 gap-1">
            <ActionIcon className="size-3" />
            {config.label}
          </Badge>
          <Badge
            variant={OVERLAP_VARIANT[study.overlapLevel] ?? "outline"}
            className="shrink-0"
          >
            重叠 {study.overlapLevel}
          </Badge>
          <span className="truncate text-sm font-medium">{study.title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatPercentage(study.confidence)}
          </span>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <CardContent className="gap-4 px-4 py-4">
            <Progress value={study.confidence * 100} className="h-1" />

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                涉及教材
              </span>
              <div className="flex flex-wrap gap-1.5">
                {study.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
                  >
                    <BookOpen className="size-3 text-muted-foreground" />
                    <span className="font-medium">{source.bookName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{source.chapterName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{source.unitName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                决策理由
              </span>
              <p className="text-sm leading-relaxed text-foreground/80">
                {study.reason}
              </p>
            </div>

            {study.complementarySummary && (
              <div className="rounded-md bg-blue-500/5 px-3 py-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  互补内容
                </span>
                <p className="mt-1 text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/80">
                  {study.complementarySummary}
                </p>
              </div>
            )}

            {study.beforeSnippets.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  整合前片段
                </span>
                {study.beforeSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border-l-2 border-muted-foreground/30 bg-muted/30 px-3 py-2"
                  >
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {snippet}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {study.afterSnippet && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  整合后片段
                </span>
                <div className="rounded-md border-l-2 border-emerald-500/50 bg-emerald-500/5 px-3 py-2">
                  <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                    {study.afterSnippet}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
}

function CaseStudies({ caseStudies, isLoading, className }: CaseStudiesProps) {
  if (isLoading) {
    return (
      <Card className={cn("gap-4", className)} data-slot="case-studies">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (caseStudies.length === 0) {
    return (
      <Card className={cn("gap-4", className)} data-slot="case-studies">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="size-4" />
            <span>典型案例</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <BookOpen className="size-8 opacity-40" />
            <p className="text-sm">暂无典型案例</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-0", className)} data-slot="case-studies">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4" />
            <span>典型案例</span>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {caseStudies.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="px-4 py-4">
        <ScrollArea className="max-h-[500px]">
          <div className="flex flex-col gap-4 pr-3">
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { CaseStudies };
export type { CaseStudiesProps };
