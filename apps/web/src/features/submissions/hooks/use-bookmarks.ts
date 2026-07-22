"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listBookmarks,
  toggleBookmark,
  type ToggleBookmarkInput,
} from "@/features/submissions/api/bookmarks.api";
import type {
  BookmarkItem,
  BookmarkListResponse,
} from "@/features/submissions/types/bookmark.types";

export const BOOKMARK_QUERY_KEY = ["bookmarks"] as const;
const bookmarksQueryKey = [
  ...BOOKMARK_QUERY_KEY,
  { page: 1, limit: 100 },
] as const;

export function useBookmarks() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: bookmarksQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: () => listBookmarks({ page: 1, limit: 100 }),
  });

  const toggleMutation = useMutation({
    mutationFn: (input: ToggleBookmarkInput) => toggleBookmark(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: BOOKMARK_QUERY_KEY });
      const snapshots = queryClient.getQueriesData<BookmarkListResponse>({
        queryKey: BOOKMARK_QUERY_KEY,
      });
      const isCurrentlyBookmarked = snapshots.some(([, page]) =>
        page?.items.some((item) => item.articleId === input.articleId),
      );

      queryClient.setQueriesData<BookmarkListResponse>(
        { queryKey: BOOKMARK_QUERY_KEY },
        (previous) =>
          updateBookmarkPage(
            previous,
            {
              articleId: input.articleId,
              bookmarked: !isCurrentlyBookmarked,
            },
            input,
          ),
      );

      return { snapshots };
    },
    onSuccess: (result, input) => {
      queryClient.setQueriesData<BookmarkListResponse>(
        { queryKey: BOOKMARK_QUERY_KEY },
        (previous) => updateBookmarkPage(previous, result, input),
      );
    },
    onError: (_error, _input, context) => {
      for (const [queryKey, previous] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOOKMARK_QUERY_KEY,
        refetchType: "none",
      });
    },
  });

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload: async () => {
      await query.refetch();
    },
    remove: (articleId: string) => toggleMutation.mutateAsync({ articleId }),
    toggle: toggleMutation.mutateAsync,
    togglePending: toggleMutation.isPending,
    toggleVariables: toggleMutation.variables,
  };
}

function updateBookmarkPage(
  previous: BookmarkListResponse | undefined,
  result: { articleId: string; bookmarked: boolean; bookmarkedAt?: string },
  input: ToggleBookmarkInput,
): BookmarkListResponse | undefined {
  if (!previous) return previous;

  const withoutTarget = previous.items.filter(
    (item) => item.articleId !== result.articleId,
  );
  if (!result.bookmarked || !input.article) {
    return { ...previous, items: withoutTarget };
  }

  const inserted: BookmarkItem = {
    articleId: result.articleId,
    bookmarkedAt: result.bookmarkedAt ?? new Date().toISOString(),
    article: input.article,
  };
  return { ...previous, items: [inserted, ...withoutTarget] };
}
