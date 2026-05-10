import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  listTextbooks,
  uploadTextbook,
  deleteTextbook,
} from "@/lib/api/textbooks";

function useTextbooks() {
  return useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: ({ signal }) => listTextbooks(signal),
  });
}

interface UploadVariables {
  file: File;
  onProgress?: (percent: number) => void;
}

function useUploadTextbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadVariables) =>
      uploadTextbook(file, onProgress),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.list(),
      });
    },
    onError: (error: Error) => {
      console.error("上传失败:", error.message);
    },
  });
}

function useDeleteTextbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTextbook(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.list(),
      });
    },
  });
}

function useBatchDeleteTextbooks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: readonly string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => deleteTextbook(id)),
      );

      const failed: { id: string; reason: string }[] = results
        .map((r, i) => {
          if (r.status === "rejected") {
            return { id: ids[i]!, reason: String(r.reason) };
          }
          return null;
        })
        .filter(Boolean) as { id: string; reason: string }[];

      return {
        deleted: ids.length - failed.length,
        failed,
      };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.list(),
      });
      if (result.failed.length > 0) {
        console.warn(`${result.failed.length} 个教材删除失败`, result.failed);
      }
    },
  });
}

export {
  useTextbooks,
  useUploadTextbook,
  useDeleteTextbook,
  useBatchDeleteTextbooks,
};
