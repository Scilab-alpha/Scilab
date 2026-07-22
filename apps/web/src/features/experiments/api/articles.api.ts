import { apiRequest } from "@/core/api";
import type {
  ArticleDetailResponse,
  ArticleGraph,
  ArticleListParams,
  ArticleListResponse,
} from "@/features/experiments/types/article.types";

const defaultLimit = 20;

export function buildArticleQuery({
  cursor,
  q,
  limit = defaultLimit,
  publicationYear,
  publicationYearFrom,
  publicationYearTo,
  keywordId,
  topicId,
  authorId,
  journalId,
  publisher,
  country,
  sort,
}: ArticleListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const trimmedQuery = q?.trim();

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  for (const [name, value] of [
    ["keywordId", keywordId],
    ["topicId", topicId],
    ["authorId", authorId],
    ["journalId", journalId],
  ] as const) {
    if (value?.trim()) {
      params.set(name, value.trim());
    }
  }

  if (publicationYear) {
    params.set("publicationYear", String(publicationYear));
  } else {
    if (publicationYearFrom) {
      params.set("publicationYearFrom", String(publicationYearFrom));
    }
    if (publicationYearTo) {
      params.set("publicationYearTo", String(publicationYearTo));
    }
  }

  if (publisher?.trim()) {
    params.set("publisher", publisher.trim());
  }

  const normalizedCountry = country?.trim().toUpperCase();
  if (normalizedCountry && /^[A-Z]{2}$/.test(normalizedCountry)) {
    params.set("country", normalizedCountry);
  }

  const hasResearchQuery = Boolean(
    trimmedQuery || keywordId?.trim() || topicId?.trim(),
  );
  if (sort && (sort !== "relevant" || hasResearchQuery)) {
    params.set("sort", sort);
  }

  return params.toString();
}

/** GET /academic/articles */
export function listArticles(
  params: ArticleListParams = {},
): Promise<ArticleListResponse> {
  return apiRequest<ArticleListResponse>({
    method: "GET",
    path: `/academic/articles?${buildArticleQuery(params)}`,
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
