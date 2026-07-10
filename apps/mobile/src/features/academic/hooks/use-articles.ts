import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import { listArticles } from "@/features/academic/api/article.service";

import type {
  ArticleGraph,
  CursorPage,
} from "@/features/academic/types/article.type";

const pageSize = 20;

export function useArticles(keyword: string) {
  const normalizedKeyword = keyword.trim();

  return useInfiniteQuery<
    CursorPage<ArticleGraph>,
    Error,
    InfiniteData<CursorPage<ArticleGraph>>,
    readonly ["academic", "articles", string],
    string | null
  >({
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listArticles({
        cursor: pageParam,
        keyword: normalizedKeyword || null,
        limit: pageSize,
      }),
    queryKey: ["academic", "articles", normalizedKeyword],
  });
}
