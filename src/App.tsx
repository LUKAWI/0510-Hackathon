import { lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TextbookList } from '@/components/textbook/TextbookList';
import { FileUploadZone } from '@/components/textbook/FileUploadZone';
import { ErrorBoundary } from '@/components/global/ErrorBoundary';
import { ErrorToast } from '@/components/global/ErrorToast';
import { LoadingOverlay } from '@/components/global/LoadingOverlay';
import { GraphSkeleton } from '@/components/global/LoadingSkeleton';
import { useGraphStore } from '@/stores/graph';

const GraphCanvas = lazy(() => import('@/components/graph/GraphCanvas').then(m => ({ default: m.GraphCanvas })));
const GraphToolbar = lazy(() => import('@/components/graph/GraphToolbar').then(m => ({ default: m.GraphToolbar })));
const GraphLegend = lazy(() => import('@/components/graph/GraphLegend').then(m => ({ default: m.GraphLegend })));
const NodeDetailPanel = lazy(() => import('@/components/graph/NodeDetailPanel').then(m => ({ default: m.NodeDetailPanel })));

function LeftContent() {
  return (
    <div className="flex flex-col gap-4">
      <FileUploadZone />
      <TextbookList />
    </div>
  );
}

function CenterContent() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectNode = useGraphStore((s) => s.selectNode);

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <Suspense fallback={null}>
          <GraphToolbar />
        </Suspense>
      </div>

      <div className="relative flex-1">
        <Suspense fallback={<GraphSkeleton />}>
          <GraphCanvas
            nodes={[]}
            edges={[]}
            onNodeClick={(nodeId) => selectNode(nodeId)}
            className="h-full w-full"
          />

          <div className="absolute bottom-3 left-3">
            <GraphLegend />
          </div>

          {selectedNodeId && (
            <div className="absolute right-3 top-3 w-72">
              <NodeDetailPanel
                nodes={[]}
                edges={[]}
                selectedNodeId={selectedNodeId}
              />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout leftContent={<LeftContent />}>
        <CenterContent />
      </MainLayout>
      <ErrorToast />
      <LoadingOverlay />
    </ErrorBoundary>
  );
}
