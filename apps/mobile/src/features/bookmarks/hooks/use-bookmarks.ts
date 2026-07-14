import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getBookmarkStatus,
  listBookmarks,
} from "@/features/bookmarks/api/bookmark.service";

import type { BookmarkPage } from "@/features/bookmarks/types/bookmark.type";

const pageSize = 20;

export const bookmarksQueryKey = ["bookmarks"] as const;

export function bookmarkStatusQueryKey(articleId: string) {
  return [...bookmarksQueryKey, "status", articleId] as const;
}

export function useBookmarks() {
  return useInfiniteQuery<
    BookmarkPage,
    Error,
    InfiniteData<BookmarkPage>,
    typeof bookmarksQueryKey,
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listBookmarks({
        limit: pageSize,
        page: pageParam,
      }),
    queryKey: bookmarksQueryKey,
  });
}

export function getBookmarkedArticleIds(
  data: InfiniteData<BookmarkPage> | undefined,
) {
  return new Set(
    data?.pages.flatMap((page) =>
      page.items.map((bookmark) => bookmark.articleId),
    ) ?? [],
  );
}

export function useBookmarkStatus(articleId: string) {
  const normalizedArticleId = articleId.trim();

  return useQuery({
    enabled: Boolean(normalizedArticleId),
    queryFn: () => getBookmarkStatus(normalizedArticleId),
    queryKey: bookmarkStatusQueryKey(normalizedArticleId),
  });
}
