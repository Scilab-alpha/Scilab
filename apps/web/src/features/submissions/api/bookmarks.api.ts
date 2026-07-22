import { apiRequest } from "@/core/api";
import { notifyBookmarkSaved } from "@/features/notifications/api/local-notifications";
import {
  isServerBookmarkableArticleId,
  listLocalBookmarks,
  removeLocalBookmark,
  toggleLocalBookmark,
} from "@/features/submissions/api/local-bookmarks";
import type {
  BookmarkArticleSummary,
  BookmarkListParams,
  BookmarkListResponse,
  ToggleBookmarkRequest,
  ToggleBookmarkResponse,
} from "@/features/submissions/types/bookmark.types";

const defaultLimit = 20;

function buildQuery(params: BookmarkListParams = {}) {
  return new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? defaultLimit),
  }).toString();
}

async function listServerBookmarks(
  params: BookmarkListParams = {},
): Promise<BookmarkListResponse> {
  try {
    return await apiRequest<BookmarkListResponse>({
      authenticated: true,
      method: "GET",
      path: `/bookmarks?${buildQuery(params)}`,
    });
  } catch {
    // Public/session failures should not hide locally saved OpenAlex bookmarks.
    return {
      items: [],
      page: params.page ?? 1,
      limit: params.limit ?? defaultLimit,
      hasMore: false,
    };
  }
}

/** GET /bookmarks (+ local OpenAlex bookmarks when ids are not UUID). */
export async function listBookmarks(
  params: BookmarkListParams = {},
): Promise<BookmarkListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? defaultLimit;
  const [server, local] = await Promise.all([
    listServerBookmarks(params),
    Promise.resolve(listLocalBookmarks()),
  ]);

  const seen = new Set(server.items.map((item) => item.articleId));
  const merged = [
    ...server.items,
    ...local.filter((item) => !seen.has(item.articleId)),
  ];

  const start = (page - 1) * limit;
  const slice = merged.slice(start, start + limit);

  return {
    items: slice,
    page,
    limit,
    hasMore: start + limit < merged.length || server.hasMore,
  };
}

export type ToggleBookmarkInput = ToggleBookmarkRequest & {
  /** Needed when saving OpenAlex articles locally (public API rejects non-UUID ids). */
  article?: BookmarkArticleSummary;
};

function bookmarkTitle(articleId: string, article?: BookmarkArticleSummary) {
  return article?.title?.trim() || articleId;
}

function notifyIfBookmarked(
  result: ToggleBookmarkResponse,
  article?: BookmarkArticleSummary,
) {
  if (result.bookmarked) {
    notifyBookmarkSaved({
      articleId: result.articleId,
      title: bookmarkTitle(result.articleId, article),
    });
  }
  return result;
}

/**
 * POST /bookmarks/toggle for UUID ids.
 * OpenAlex ids (W…) are saved in localStorage because public API requires uuid.
 */
export async function toggleBookmark(
  body: ToggleBookmarkInput,
): Promise<ToggleBookmarkResponse> {
  const articleId = body.articleId.trim();

  if (!isServerBookmarkableArticleId(articleId)) {
    return notifyIfBookmarked(
      toggleLocalBookmark({
        articleId,
        article: body.article,
      }),
      body.article,
    );
  }

  try {
    const result = await apiRequest<ToggleBookmarkResponse>({
      authenticated: true,
      method: "POST",
      path: "/bookmarks/toggle",
      body: { articleId },
    });
    return notifyIfBookmarked(result, body.article);
  } catch (error) {
    // If public API still rejects (legacy mismatch), fall back to local save.
    const message = error instanceof Error ? error.message : "";
    if (/articleId is invalid/i.test(message)) {
      return notifyIfBookmarked(
        toggleLocalBookmark({
          articleId,
          article: body.article,
        }),
        body.article,
      );
    }
    throw error;
  }
}

export async function removeBookmark(articleId: string) {
  if (!isServerBookmarkableArticleId(articleId)) {
    removeLocalBookmark(articleId);
    return { articleId, bookmarked: false };
  }

  return toggleBookmark({ articleId });
}
