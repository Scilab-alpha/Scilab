import { apiRequest } from "@/core/api";
import {
  academicArticlePageSize,
  academicSearchTimeoutMs,
} from "@/core/api/query-config";
import type {
  ArticleDetailResponse,
  ArticleGraph,
  ArticleListParams,
  ArticleListResponse,
} from "@/features/experiments/types/article.types";

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value?: string | number | null,
) {
  if (value == null) {
    return;
  }

  const normalized = String(value).trim();
  if (normalized) {
    params.set(key, normalized);
  }
}

/** Exported for unit tests — builds GET /academic/articles query string. */
export function buildArticleQuery({
  cursor,
  q,
  keywordId,
  topicId,
  authorId,
  journalId,
  publicationYear,
  publicationYearFrom,
  publicationYearTo,
  publisher,
  country,
  sort,
  limit = academicArticlePageSize,
}: ArticleListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  setOptionalParam(params, "cursor", cursor);
  setOptionalParam(params, "q", q);
  setOptionalParam(params, "keywordId", keywordId);
  setOptionalParam(params, "topicId", topicId);
  setOptionalParam(params, "authorId", authorId);
  setOptionalParam(params, "journalId", journalId);
  setOptionalParam(params, "publicationYear", publicationYear);
  setOptionalParam(params, "publicationYearFrom", publicationYearFrom);
  setOptionalParam(params, "publicationYearTo", publicationYearTo);
  setOptionalParam(params, "publisher", publisher);
  setOptionalParam(params, "country", country);
  setOptionalParam(params, "sort", sort);

  return params.toString();
}

/** GET /academic/articles */
export function listArticles(
  params: ArticleListParams = {},
): Promise<ArticleListResponse> {
  return apiRequest<ArticleListResponse>({
    method: "GET",
    path: `/academic/articles?${buildArticleQuery(params)}`,
    timeoutMs: academicSearchTimeoutMs,
  });
}

export function getArticleById(
  articleId: string,
): Promise<ArticleDetailResponse> {
  return apiRequest<ArticleGraph>({
    method: "GET",
    path: `/academic/articles/${encodeURIComponent(articleId)}`,
  });
}
