import type {
  GraphData,
} from '@/types';
import { get } from './client';

const PATHS = {
  graph: (textbookId: string) => `graph/${textbookId}`,
  merged: 'graph/merged/all',
  node: (nodeId: string) => `graph/node/${nodeId}`,
  search: (keyword: string) => `graph/search/${keyword}`,
} as const;

export function getGraph(
  textbookId: string,
  signal?: AbortSignal,
): Promise<GraphData> {
  return get<GraphData>(PATHS.graph(textbookId), undefined, signal);
}

export function getMergedGraph(
  signal?: AbortSignal,
): Promise<GraphData> {
  return get<GraphData>(PATHS.merged, undefined, signal);
}

export function getNodeDetail(
  nodeId: string,
  signal?: AbortSignal,
): Promise<{ node: { id: string; label: string; type: string; properties: Record<string, unknown> }; related_nodes: Array<{ id: string; label: string; type: string; relation: string }> }> {
  return get(PATHS.node(nodeId), undefined, signal);
}

export function searchGraph(
  keyword: string,
  signal?: AbortSignal,
): Promise<Array<{ id: string; label: string; type: string; properties: Record<string, unknown> }>> {
  return get(PATHS.search(keyword), undefined, signal);
}
