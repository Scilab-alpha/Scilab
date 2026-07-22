import { apiRequest } from "@/core/api";
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

/** GET /bookmarks */
export function listBookmarks(
  params: BookmarkListParams = {},
): Promise<BookmarkListResponse> {
  return apiRequest<BookmarkListResponse>({
    authenticated: true,
    method: "GET",
    path: `/bookmarks?${buildQuery(params)}`,
  });
}

/** Load the complete backend bookmark collection for accurate Saved state. */
export async function listAllBookmarks(): Promise<BookmarkListResponse> {
  const items: BookmarkListResponse["items"] = [];
  const limit = 100;
  let page = 1;

  while (true) {
    const result = await listBookmarks({ page, limit });
    items.push(...result.items);
    if (!result.hasMore) {
      return { items, page: 1, limit, hasMore: false };
    }
    page += 1;
  }
}

export type ToggleBookmarkInput = ToggleBookmarkRequest & {
  article?: BookmarkArticleSummary;
};

export async function toggleBookmark(
  body: ToggleBookmarkInput,
): Promise<ToggleBookmarkResponse> {
  const articleId = body.articleId.trim();
  return apiRequest<ToggleBookmarkResponse>({
    authenticated: true,
    method: "POST",
    path: "/bookmarks",
    body: { articleId },
  });
}
