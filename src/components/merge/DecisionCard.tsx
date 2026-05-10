import { useState } from "react";
import {
  GitMerge,
  ArrowRightLeft,
  Trash2,
  Plus,
  Eye,
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { staggerStyle } from "@/lib/animation";
import { formatPercentage } from "@/lib/constants";
import type { MergeAction, MergeDecision } from "@/types";

interface DecisionCardProps {
  decision: MergeDecision;
  index?: number;
  knowledgeNames?: ReadonlyMap<string, string>;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onModify?: (id: string) => void;
  onNavigateToUnit?: (unitId: string) => void;
  className?: string;
}

interface ActionConfig {
  icon: LucideIcon;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  colorClass: string;
}

const ACTION_MAP: Record<MergeAction, ActionConfig> = {
  merge: {
    icon: GitMerge,
    label: "合并",
    variant: "default",
    colorClass: "text-emerald-500",
  },
  keep_both: {
    icon: ArrowRightLeft,
    label: "保留双方",
    variant: "secondary",
    colorClass: "text-blue-500",
  },
  keep_a_remove_b: {
    icon: Trash2,
    label: "保留A移除B",
    variant: "outline",
    colorClass: "text-amber-500",
  },
  keep_b_remove_a: {
    icon: Trash2,
    label: "保留B移除A",
    variant: "outline",
    colorClass: "text-amber-500",
  },
  add: {
    icon: Plus,
    label: "新增",
    variant: "secondary",
    colorClass: "text-blue-500",
  },
  review: {
    icon: Eye,
    label: "待审核",
    variant: "destructive",
    colorClass: "text-red-500",
  },
};

const OVERLAP_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  高: "destructive",
  中: "secondary",
  低: "outline",
};

function DecisionCard({
  decision,
  index = 0,
  knowledgeNames,
  onAccept,
  onReject,
  onModify,
  onNavigateToUnit,
  className,
}: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const config = ACTION_MAP[decision.action];
  const ActionIcon = config.icon;
  const confidencePercent = decision.confidence * 100;

  return (
    <Card className={cn("gap-0 py-0 overflow-hidden animate-fade-in-up", className)} data-slot="decision-card" style={staggerStyle(index)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Badge variant={config.variant} className="gap-1">
          <ActionIcon className="size-3" />
          {config.label}
        </Badge>
        <Badge variant={OVERLAP_VARIANT[decision.overlapLevel] ?? "outline"}>
          重叠度 {decision.overlapLevel}
        </Badge>
        {decision.hasComplementary && (
          <Badge variant="secondary" className="text-xs">
            互补
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span>置信度</span>
          <span className={cn("font-medium tabular-nums", config.colorClass)}>
            {formatPercentage(decision.confidence)}
          </span>
        </div>
      </div>

      <CardContent className="px-4 py-3">
        <Progress value={confidencePercent} className="mb-3 h-1.5" />

        {decision.sourceUnitIds.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {decision.sourceUnitIds.map((unitId) => (
              <button
                key={unitId}
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-accent"
                onClick={() => onNavigateToUnit?.(unitId)}
              >
                {knowledgeNames?.get(unitId) ?? unitId}
              </button>
            ))}
            {decision.targetUnitId && (
              <>
                <span className="flex items-center text-xs text-muted-foreground">→</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  onClick={() => onNavigateToUnit?.(decision.targetUnitId!)}
                >
                  {knowledgeNames?.get(decision.targetUnitId) ?? decision.targetUnitId}
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          className="flex w-full items-center gap-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          <span>决策理由</span>
        </button>

        {expanded && (
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
            {decision.reason}
          </p>
        )}

        {decision.hasComplementary && decision.complementarySummary && (
          <p className="mt-2 rounded-md bg-blue-500/5 px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400">
            {decision.complementarySummary}
          </p>
        )}
      </CardContent>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <Button
          size="xs"
          variant="default"
          className="gap-1"
          onClick={() => onAccept?.(decision.id)}
        >
          <Check className="size-3" />
          接受
        </Button>
        <Button
          size="xs"
          variant="destructive"
          className="gap-1"
          onClick={() => onReject?.(decision.id)}
        >
          <X className="size-3" />
          拒绝
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="gap-1"
          onClick={() => onModify?.(decision.id)}
        >
          <Pencil className="size-3" />
          修改
        </Button>
      </div>
    </Card>
  );
}

export { DecisionCard };
export type { DecisionCardProps };
