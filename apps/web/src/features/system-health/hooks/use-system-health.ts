"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { getAdminDashboardMetrics } from "@/features/system-health/api/admin-sync.api";
import { buildSystemHealthSnapshot } from "@/features/system-health/api/build-system-health-snapshot";
import { adminDashboardQueryKey } from "@/features/system-health/hooks/admin-sync-query-keys";

export function useSystemHealth() {
  const query = useQuery({
    queryKey: adminDashboardQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: getAdminDashboardMetrics,
  });

  const data = useMemo(
    () =>
      query.data
        ? buildSystemHealthSnapshot({
            dashboard: query.data,
            syncLogs: query.data.sync.recentLogs ?? [],
          })
        : null,
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}
