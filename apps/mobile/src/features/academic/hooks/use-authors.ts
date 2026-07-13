import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import { listAuthors } from "@/features/academic/api/author.service";

import type {
  AuthorListItem,
  CursorPage,
} from "@/features/academic/types/article.type";

const pageSize = 20;

export function useAuthors({ enabled = true }: { enabled?: boolean } = {}) {
  return useInfiniteQuery<
    CursorPage<AuthorListItem>,
    Error,
    InfiniteData<CursorPage<AuthorListItem>>,
    readonly ["academic", "authors"],
    string | null
  >({
    enabled,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listAuthors({
        cursor: pageParam,
        limit: pageSize,
      }),
    queryKey: ["academic", "authors"],
  });
}
