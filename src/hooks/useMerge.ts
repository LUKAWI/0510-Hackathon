import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  runIntegration,
  getDecisions,
} from "@/lib/api/merge";

function useDecisions() {
  return useQuery({
    queryKey: queryKeys.merge.decisions(),
    queryFn: ({ signal }) => getDecisions(signal),
  });
}

function useRunIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { textbook_ids?: string[]; similarity_threshold?: number }) => runIntegration(request),
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.merge.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.graph.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
      ]);
    },
  });
}

export {
  useDecisions,
  useRunIntegration,
};
