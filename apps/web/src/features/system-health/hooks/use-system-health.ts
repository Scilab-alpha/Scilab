"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listAdminJobs,
  listAdminSyncLogs,
} from "@/features/system-health/api/system-health.api";

export const SYSTEM_HEALTH_QUERY_KEY = ["admin", "system-health"] as const;

export function useSystemHealth(page: number, pageSize = 20) {
  const jobsQuery = useQuery({
    queryKey: [...SYSTEM_HEALTH_QUERY_KEY, "jobs"],
    queryFn: listAdminJobs,
    staleTime: listQueryStaleTimeMs,
  });
  const logsQuery = useQuery({
    queryKey: [...SYSTEM_HEALTH_QUERY_KEY, "sync-logs", { page, pageSize }],
    queryFn: () => listAdminSyncLogs({ page, pageSize }),
    staleTime: listQueryStaleTimeMs,
  });

  return {
    jobs: jobsQuery.data ?? [],
    logs: logsQuery.data,
    jobsLoading: jobsQuery.isLoading,
    logsLoading: logsQuery.isLoading,
    jobsError: jobsQuery.error
      ? getUserFriendlyApiErrorMessage(jobsQuery.error)
      : null,
    logsError: logsQuery.error
      ? getUserFriendlyApiErrorMessage(logsQuery.error)
      : null,
    isFetching: jobsQuery.isFetching || logsQuery.isFetching,
    reload: async () => {
      await Promise.all([jobsQuery.refetch(), logsQuery.refetch()]);
    },
  };
}
