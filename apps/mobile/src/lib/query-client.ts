import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/services/api";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.status > 0 &&
            error.status < 500
          ) {
            return false;
          }

          return failureCount < 2;
        },
        staleTime: 60_000,
      },
    },
  });
}
