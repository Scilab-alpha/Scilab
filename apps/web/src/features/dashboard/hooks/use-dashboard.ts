"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { fetchCatalogSample } from "@/features/dashboard/api/fetch-catalog-sample";
import { buildDashboardInsights } from "@/features/dashboard/lib/build-dashboard-insights";

export function useDashboard() {
  const query = useQuery({
    queryKey: ["dashboard", "catalog-insights"] as const,
    staleTime: listQueryStaleTimeMs,
    queryFn: async () => {
      const sample = await fetchCatalogSample();
      return buildDashboardInsights(sample);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? getUserFriendlyApiErrorMessage(query.error)
      : null,
    reload: () => query.refetch(),
  };
}
