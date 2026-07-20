"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listApiSources,
  refreshApiSource,
  updateApiSourceStatus,
} from "@/features/api-sources/api/api-sources.api";
import type { ApiSourceStatus } from "@/features/api-sources/types/api-source.types";

const sourcesQueryKey = ["admin", "api-sources"] as const;

export function useApiSources() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: sourcesQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: listApiSources,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      sourceId,
      status,
    }: {
      sourceId: string;
      status: ApiSourceStatus;
    }) => {
      updateApiSourceStatus(sourceId, status);
      return listApiSources();
    },
    onSuccess: (sources) => {
      queryClient.setQueryData(sourcesQueryKey, sources);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: (sourceId: string) => refreshApiSource(sourceId),
    onSuccess: (sources) => {
      queryClient.setQueryData(sourcesQueryKey, sources);
    },
  });

  return {
    sources: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
    setStatus: (sourceId: string, status: ApiSourceStatus) =>
      statusMutation.mutateAsync({ sourceId, status }),
    refresh: (sourceId: string) => refreshMutation.mutateAsync(sourceId),
    isMutating: statusMutation.isPending || refreshMutation.isPending,
  };
}
