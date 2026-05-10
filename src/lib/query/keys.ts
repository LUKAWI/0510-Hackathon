export const queryKeys = {
  documents: {
    all: ['documents'] as const,
    list: () => [...queryKeys.documents.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },
  graph: {
    all: ['graph'] as const,
    nodes: () => [...queryKeys.graph.all, 'nodes'] as const,
    edges: () => [...queryKeys.graph.all, 'edges'] as const,
    byDocument: (docId: string) =>
      [...queryKeys.graph.all, 'document', docId] as const,
  },
  chat: {
    all: ['chat'] as const,
    sessions: () => [...queryKeys.chat.all, 'sessions'] as const,
    messages: (sessionId: string) =>
      [...queryKeys.chat.all, 'messages', sessionId] as const,
  },
  rag: {
    all: ['rag'] as const,
    indexStatus: (documentId: string) =>
      [...queryKeys.rag.all, 'indexStatus', documentId] as const,
    indexStatusAll: () => [...queryKeys.rag.all, 'indexStatusAll'] as const,
  },
  merge: {
    all: ['merge'] as const,
    candidates: (threshold?: number) =>
      [...queryKeys.merge.all, 'candidates', threshold] as const,
    decisions: () => [...queryKeys.merge.all, 'decisions'] as const,
  },
  report: {
    all: ['report'] as const,
    list: () => [...queryKeys.report.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.report.all, 'detail', id] as const,
    latest: () => [...queryKeys.report.all, 'latest'] as const,
  },
} as const;
