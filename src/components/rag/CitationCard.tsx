import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPercentage } from "@/lib/utils";
import { staggerDelay } from "@/lib/animation";
import type { Citation } from "@/types";

interface RelevanceTier {
  readonly color: string;
  readonly bg: string;
  readonly border: string;
  readonly label: string;
}

const RELEVANCE_TIERS = {
  high: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "高相关",
  } satisfies RelevanceTier,
  medium: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "中相关",
  } satisfies RelevanceTier,
  low: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "低相关",
  } satisfies RelevanceTier,
} as const;

function getRelevanceTier(similarity: number): RelevanceTier {
  if (similarity >= 0.8) return RELEVANCE_TIERS.high;
  if (similarity >= 0.6) return RELEVANCE_TIERS.medium;
  return RELEVANCE_TIERS.low;
}

function getSimilarityBarColor(similarity: number): string {
  if (similarity >= 0.8) return "bg-emerald-500";
  if (similarity >= 0.6) return "bg-amber-500";
  return "bg-red-400";
}

interface CitationCardProps {
  /** 1-based citation index (for display as [1], [2], etc.) */
  readonly index: number;
  /** Citation data */
  readonly citation: Citation;
  /** Similarity score from vector retrieval (0–1) */
  readonly similarity?: number;
  /** Whether the card starts expanded */
  readonly defaultExpanded?: boolean;
  readonly className?: string;
}

function CitationCard({
  index,
  citation,
  similarity,
  defaultExpanded = false,
  className,
}: CitationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const tier = similarity !== undefined ? getRelevanceTier(similarity) : null;
  const barColor = similarity !== undefined ? getSimilarityBarColor(similarity) : null;

  return (
    <div
      className={cn(
        "group animate-fade-in-up rounded-lg border border-border bg-card transition-colors",
        tier && `${tier.border}`,
        className,
      )}
      style={staggerDelay(index - 1, 30)}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none",
            "bg-primary/10 text-primary",
          )}
        >
          {index}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium leading-tight">
              {citation.textbook}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {citation.chapter && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <FileText className="size-3" />
                {citation.chapter}
              </Badge>
            )}

            {citation.relevance !== undefined && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Percent className="size-3" />
                {formatPercentage(citation.relevance)}
              </Badge>
            )}

            {similarity !== undefined && tier && (
              <Badge
                variant="outline"
                className={cn("gap-1 text-[11px]", tier.color, tier.bg)}
              >
                <Percent className="size-3" />
                {tier.label} {formatPercentage(similarity)}
              </Badge>
            )}
          </div>

          {similarity !== undefined && barColor && (
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${Math.round(similarity * 100)}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {Math.round(similarity * 100)}%
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? "收起原文" : "展开原文"}
          className="shrink-0 text-muted-foreground"
        >
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {citation.snippet}
          </p>
        </div>
      )}
    </div>
  );
}

export { CitationCard, RELEVANCE_TIERS };
export type { CitationCardProps };
