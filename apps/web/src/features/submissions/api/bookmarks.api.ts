import { apiRequest } from "@/core/api";
import { notifyBookmarkSaved } from "@/features/notifications/api/local-notifications";
import {
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

/** GET /bookmarks plus locally cached bookmarks from legacy sessions. */
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

export async function toggleBookmark(
  body: ToggleBookmarkInput,
): Promise<ToggleBookmarkResponse> {
  const articleId = body.articleId.trim();

  try {
    const result = await apiRequest<ToggleBookmarkResponse>({
      authenticated: true,
      method: "POST",
      path: "/bookmarks",
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
  const result = await toggleBookmark({ articleId });
  removeLocalBookmark(articleId);

  if (!result.bookmarked) {
    return result;
  }

  const retry = await toggleBookmark({ articleId });
  removeLocalBookmark(articleId);
  return retry;
}
