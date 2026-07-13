import { apiRequest } from "@/services/api";

import type {
  ArticleGraph,
  ArticleListParams,
  CursorPage,
} from "@/features/academic/types/article.type";

const defaultLimit = 20;

export function listArticles({
  cursor,
  keywordId,
  limit = defaultLimit,
  publicationYear,
  publicationYearFrom,
  publicationYearTo,
  q,
  sort,
  topicId,
}: ArticleListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  if (cursor) {
    params.set("cursor", cursor);
  }

  setTextParam(params, "q", q);
  setTextParam(params, "keywordId", keywordId);
  setTextParam(params, "topicId", topicId);
  setNumberParam(params, "publicationYear", publicationYear);
  setNumberParam(params, "publicationYearFrom", publicationYearFrom);
  setNumberParam(params, "publicationYearTo", publicationYearTo);
  setTextParam(params, "sort", sort);

  return apiRequest<CursorPage<ArticleGraph>>({
    method: "GET",
    path: `/academic/articles?${params.toString()}`,
  });
}

function setTextParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim();

  if (normalized) {
    params.set(key, normalized);
  }
}

function setNumberParam(
  params: URLSearchParams,
  key: string,
  value: number | null | undefined,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

export function getArticleById(articleId: string) {
  return apiRequest<ArticleGraph>({
    method: "GET",
    path: `/academic/articles/${encodeURIComponent(articleId)}`,
  });
}
