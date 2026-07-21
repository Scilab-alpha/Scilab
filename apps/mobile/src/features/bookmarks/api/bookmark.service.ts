import { apiRequest } from "@/services/api";

import type {
  BookmarkArticlePayload,
  BookmarkListParams,
  BookmarkPage,
  ToggleBookmarkResult,
} from "@/features/bookmarks/types/bookmark.type";

const defaultLimit = 20;

type BookmarkApiItem = {
  article: BookmarkArticlePayload;
  articleId: string;
  bookmarkedAt: string;
};

type BookmarkApiPage = {
  hasMore: boolean;
  items: BookmarkApiItem[];
  limit: number;
  page: number;
};

export async function listBookmarks({
  limit = defaultLimit,
  page = 1,
}: BookmarkListParams = {}): Promise<BookmarkPage> {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  const result = await apiRequest<BookmarkApiPage>({
    authenticated: true,
    method: "GET",
    path: `/bookmarks?${params.toString()}`,
  });

  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      article: toArticleGraph(item.article),
    })),
  };
}

export function toggleBookmark(articleId: string) {
  return apiRequest<ToggleBookmarkResult>({
    authenticated: true,
    body: { articleId },
    method: "POST",
    path: "/bookmarks/toggle",
  });
}

export async function getBookmarkStatus(articleId: string) {
  const normalizedArticleId = articleId.trim();

  if (!normalizedArticleId) {
    return false;
  }

  let page = 1;
  const limit = 100;

  while (true) {
    const result = await listBookmarks({ limit, page });

    if (result.items.some((item) => item.articleId === normalizedArticleId)) {
      return true;
    }

    if (!result.hasMore) {
      return false;
    }

    page += 1;
  }
}

function toArticleGraph(article: BookmarkArticlePayload) {
  const {
    authors = [],
    citedArticleIds = [],
    journal = null,
    keywords = [],
    topics = [],
    ...articleNode
  } = article;

  return {
    article: articleNode,
    authors: authors ?? [],
    citedArticleIds: citedArticleIds ?? [],
    journal,
    keywords: keywords ?? [],
    topics: topics ?? [],
  };
}
