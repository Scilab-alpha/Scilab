import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

import { ApiError } from "@/shared/api/api-error";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
