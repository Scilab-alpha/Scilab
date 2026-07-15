import type { PageParams, PageResult } from "@/core/api/pagination";

export type BookmarkArticleSummary = {
  id: string;
  title: string;
  abstract: string | null;
  doi: string | null;
  publicationYear: number | null;
};

/** Item from GET /bookmarks */
export type BookmarkItem = {
  articleId: string;
  bookmarkedAt: string;
  article: BookmarkArticleSummary;
};

export type BookmarkListParams = PageParams;

export type BookmarkListResponse = PageResult<BookmarkItem>;

export type ToggleBookmarkRequest = {
  articleId: string;
};

export type ToggleBookmarkResponse = {
  articleId: string;
  bookmarked: boolean;
  bookmarkedAt?: string;
};
