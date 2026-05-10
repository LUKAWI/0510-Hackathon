import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { listReports, generateReport } from "@/lib/api/report";

function useReports() {
  return useQuery({
    queryKey: queryKeys.report.latest(),
    queryFn: async ({ signal }) => {
      const reports = await listReports(signal);
      return reports[0] ?? null;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { textbook_ids?: string[] }) => generateReport(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.report.all,
      });
    },
  });
}

export { useReports, useGenerateReport };
