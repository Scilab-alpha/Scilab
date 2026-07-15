import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import { listArticles } from "@/features/academic/api/article.service";

import type {
  ArticleGraph,
  ArticleListParams,
  CursorPage,
} from "@/features/academic/types/article.type";

const pageSize = 20;

type ArticleQueryParams = Omit<ArticleListParams, "cursor" | "limit">;

export function useArticles(params: ArticleQueryParams = {}) {
  const normalizedParams = normalizeArticleQueryParams(params);

  return useInfiniteQuery<
    CursorPage<ArticleGraph>,
    Error,
    InfiniteData<CursorPage<ArticleGraph>>,
    readonly ["academic", "articles", ArticleQueryParams],
    string | null
  >({
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listArticles({
        cursor: pageParam,
        limit: pageSize,
        ...normalizedParams,
      }),
    queryKey: ["academic", "articles", normalizedParams],
  });
}

function normalizeArticleQueryParams(
  params: ArticleQueryParams,
): ArticleQueryParams {
  return {
    keywordId: normalizeText(params.keywordId),
    publicationYear: params.publicationYear ?? null,
    publicationYearFrom: params.publicationYearFrom ?? null,
    publicationYearTo: params.publicationYearTo ?? null,
    q: normalizeText(params.q),
    sort: normalizeText(params.sort) as ArticleQueryParams["sort"],
    topicId: normalizeText(params.topicId),
  };
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null;
}
