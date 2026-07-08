import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleQueryError } from "./queryClientErrorHandler";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown, query) => {
      handleQueryError(error, query.queryKey);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown, _variables: unknown, _context: unknown, mutation) => {
      handleQueryError(error, mutation.options.mutationKey);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
});

queryClient.setQueryDefaults(["inspections"], {
  refetchOnWindowFocus: true,
});

queryClient.setQueryDefaults(["deficiencies"], {
  refetchOnWindowFocus: true,
});
