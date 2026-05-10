import { useState, useMemo, useCallback } from "react";
import {
  GitMerge,
  Play,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompressionStats } from "./CompressionStats";
import { DecisionList } from "./DecisionList";
import { CompareView } from "./CompareView";
import { ConfirmDialog } from "@/components/global/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  useDecisions,
  useRunIntegration,
} from "@/hooks/useMerge";
import type { MergeDecision, CompressionStats as CompressionStatsType } from "@/types";
import type { KnowledgeUnit } from "@/types";

interface MergePanelProps {
  knowledgeUnits?: readonly KnowledgeUnit[];
  knowledgeNames?: ReadonlyMap<string, string>;
  onNavigateToUnit?: (unitId: string) => void;
  className?: string;
}

function MergePanel({
  knowledgeUnits = [],
  knowledgeNames,
  onNavigateToUnit,
  className,
}: MergePanelProps) {
  const [activeTab, setActiveTab] = useState<"decisions" | "compare">("decisions");
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);
  const [localDecisions, setLocalDecisions] = useState<MergeDecision[]>([]);

  const { data: serverDecisions, isLoading: isLoadingDecisions } = useDecisions();
  const runIntegrationMutation = useRunIntegration();

  const decisions = useMemo(
    () => (localDecisions.length > 0 ? localDecisions : (serverDecisions ?? [])),
    [localDecisions, serverDecisions],
  );

  const previewStats = runIntegrationMutation.data as CompressionStatsType | undefined;

  const beforeUnits = useMemo(() => knowledgeUnits, [knowledgeUnits]);

  const afterUnits = useMemo(() => {
    if (!previewStats) return knowledgeUnits;
    const removedIds = new Set<string>();
    for (const d of decisions) {
      if (d.action === "merge" || d.action === "keep_a_remove_b" || d.action === "keep_b_remove_a") {
        const sourceUnitIds = d.sourceUnitIds;
        if (sourceUnitIds) {
          for (const srcId of sourceUnitIds) {
            if (srcId !== d.targetUnitId) removedIds.add(srcId);
          }
        }
      }
    }
    return knowledgeUnits.filter((u) => !removedIds.has(u.id));
  }, [knowledgeUnits, decisions, previewStats]);

  const handleAccept = useCallback((id: string) => {
    setLocalDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, action: "merge" as const } : d)),
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setLocalDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, action: "keep_both" as const } : d)),
    );
  }, []);

  const handleModify = useCallback((id: string) => {
    setLocalDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, action: "review" as const } : d)),
    );
  }, []);

  const handleBatchAccept = useCallback((ids: readonly string[]) => {
    const idSet = new Set(ids);
    setLocalDecisions((prev) =>
      prev.map((d) =>
        idSet.has(d.id) ? { ...d, action: "merge" as const } : d,
      ),
    );
  }, []);

  const handlePreview = useCallback(() => {
    if (decisions.length > 0) {
      runIntegrationMutation.mutate({});
    }
  }, [decisions, runIntegrationMutation]);

  const handleSave = useCallback(() => {
    if (decisions.length > 0) {
      runIntegrationMutation.mutate({});
    }
  }, [decisions, runIntegrationMutation]);

  const handleExecute = useCallback(() => {
    runIntegrationMutation.mutate(
      {},
      { onSuccess: () => setShowExecuteConfirm(false) },
    );
  }, [runIntegrationMutation]);

  if (isLoadingDecisions) {
    return (
      <Card className={cn("gap-4", className)} data-slot="merge-panel">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("gap-0", className)} data-slot="merge-panel">
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <GitMerge className="size-4" />
            <span>跨教材知识整合</span>
            <Badge variant="secondary" className="ml-auto tabular-nums">
              {decisions.length} 条决策
            </Badge>
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handlePreview}
              disabled={decisions.length === 0 || runIntegrationMutation.isPending}
            >
              {runIntegrationMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              预览整合
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleSave}
              disabled={decisions.length === 0 || runIntegrationMutation.isPending}
            >
              <Save className="size-3.5" />
              保存决策
            </Button>
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => setShowExecuteConfirm(true)}
              disabled={decisions.length === 0 || runIntegrationMutation.isPending}
            >
              {runIntegrationMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <GitMerge className="size-3.5" />
              )}
              执行整合
            </Button>
          </div>

          {runIntegrationMutation.isError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>整合失败，请重试</span>
            </div>
          )}

          {runIntegrationMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <span>整合完成</span>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="px-4 py-4">
          {previewStats && (
            <>
              <CompressionStats stats={previewStats} className="mb-4" />
              <Separator className="mb-4" />
            </>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="decisions">决策列表</TabsTrigger>
              <TabsTrigger value="compare">前后对比</TabsTrigger>
            </TabsList>

            <TabsContent value="decisions">
              <DecisionList
                decisions={decisions}
                knowledgeNames={knowledgeNames}
                onAccept={handleAccept}
                onReject={handleReject}
                onModify={handleModify}
                onNavigateToUnit={onNavigateToUnit}
                onBatchAccept={handleBatchAccept}
              />
            </TabsContent>

            <TabsContent value="compare">
              <CompareView
                beforeUnits={beforeUnits}
                afterUnits={afterUnits}
                decisions={decisions}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showExecuteConfirm}
        onOpenChange={setShowExecuteConfirm}
        title="执行整合"
        description={`确定要执行 ${decisions.length} 条整合决策吗？此操作将修改知识图谱，可通过回滚恢复。`}
        confirmLabel="执行"
        cancelLabel="取消"
        variant="default"
        onConfirm={handleExecute}
      />
    </>
  );
}

export { MergePanel };
export type { MergePanelProps };
