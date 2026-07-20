"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { fetchSystemHealthSnapshot } from "@/features/system-health/api/system-health.api";

export function useSystemHealth() {
  const query = useQuery({
    queryKey: ["admin", "system-health"] as const,
    staleTime: listQueryStaleTimeMs,
    queryFn: fetchSystemHealthSnapshot,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}
