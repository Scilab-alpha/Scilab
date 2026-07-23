"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listBookmarks,
  toggleBookmark,
} from "@/features/submissions/api/bookmarks.api";
import type { BookmarkItem } from "@/features/submissions/types/bookmark.types";

/** Root key so any screen can invalidate every bookmarks list query. */
export const bookmarksRootQueryKey = ["bookmarks"] as const;

const bookmarksQueryKey = [
  ...bookmarksRootQueryKey,
  { page: 1, limit: 50 },
] as const;

export function useBookmarks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: bookmarksQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: () => listBookmarks({ page: 1, limit: 50 }),
  });

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const remove = useCallback(
    async (articleId: string) => {
      const result = await toggleBookmark({ articleId });

      if (!result.bookmarked) {
        queryClient.setQueryData(
          bookmarksQueryKey,
          (previous: { items: BookmarkItem[] } | undefined) => {
            if (!previous) {
              return previous;
            }
            return {
              ...previous,
              items: previous.items.filter(
                (item) => item.articleId !== articleId,
              ),
            };
          },
        );
      }

      return result;
    },
    [queryClient],
  );

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    remove,
  };
}
