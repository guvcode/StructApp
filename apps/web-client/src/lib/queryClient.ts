import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleQueryError } from "./queryClientErrorHandler";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleQueryError }),
  mutationCache: new MutationCache({ onError: handleQueryError }),
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
