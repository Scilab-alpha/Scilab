"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listFollows,
  toggleFollow,
  updateFollowNotifyMode,
} from "@/features/follows/api/follows.api";
import type {
  FollowListParams,
  FollowListResponse,
  FollowObjectType,
  NotifyMode,
} from "@/features/follows/types/follow.types";

export const FOLLOW_QUERY_KEY = ["follows"] as const;

export function followListQueryKey(params: {
  type?: FollowObjectType;
  page: number;
  limit: number;
}) {
  return [...FOLLOW_QUERY_KEY, params] as const;
}

export function useFollows(params: FollowListParams = {}) {
  const queryClient = useQueryClient();
  const normalized = {
    type: params.type,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  const queryKey = followListQueryKey(normalized);
  const query = useQuery({
    queryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: () => listFollows(normalized),
  });

  const toggleMutation = useMutation({
    mutationFn: (input: {
      objectType: FollowObjectType;
      objectId: string;
      notifyMode?: NotifyMode;
    }) => toggleFollow(input),
    onSuccess: async (result) => {
      if (!result.followed) {
        queryClient.setQueriesData<FollowListResponse>(
          { queryKey: FOLLOW_QUERY_KEY },
          (previous) =>
            previous
              ? {
                  ...previous,
                  items: previous.items.filter(
                    (item) =>
                      item.objectType !== result.objectType ||
                      item.objectId !== result.objectId,
                  ),
                }
              : previous,
        );
      }
      await queryClient.invalidateQueries({ queryKey: FOLLOW_QUERY_KEY });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (input: {
      objectType: FollowObjectType;
      objectId: string;
      notifyMode: NotifyMode;
    }) =>
      updateFollowNotifyMode(input.objectType, input.objectId, {
        notifyMode: input.notifyMode,
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: FOLLOW_QUERY_KEY });
      const previous = queryClient.getQueriesData<FollowListResponse>({
        queryKey: FOLLOW_QUERY_KEY,
      });
      queryClient.setQueriesData<FollowListResponse>(
        { queryKey: FOLLOW_QUERY_KEY },
        (page) =>
          page
            ? {
                ...page,
                items: page.items.map((item) =>
                  item.objectType === input.objectType &&
                  item.objectId === input.objectId
                    ? { ...item, notifyMode: input.notifyMode }
                    : item,
                ),
              }
            : page,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, value]) =>
        queryClient.setQueryData(key, value),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: FOLLOW_QUERY_KEY });
    },
  });

  return {
    data: query.data,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: query.refetch,
    toggle: toggleMutation.mutateAsync,
    togglePending: toggleMutation.isPending,
    toggleVariables: toggleMutation.variables,
    updateNotifyMode: notifyMutation.mutateAsync,
    notifyPending: notifyMutation.isPending,
    notifyVariables: notifyMutation.variables,
  };
}
