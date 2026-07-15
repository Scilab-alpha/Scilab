import { apiRequest } from "@/core/api";
import type {
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

/** POST /bookmarks/toggle */
export function toggleBookmark(
  body: ToggleBookmarkRequest,
): Promise<ToggleBookmarkResponse> {
  return apiRequest<ToggleBookmarkResponse>({
    authenticated: true,
    method: "POST",
    path: "/bookmarks/toggle",
    body,
  });
}
