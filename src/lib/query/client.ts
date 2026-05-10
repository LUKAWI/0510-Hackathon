import { QueryClient } from '@tanstack/react-query';

const defaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  },
};

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

export const queryClient = createQueryClient();
