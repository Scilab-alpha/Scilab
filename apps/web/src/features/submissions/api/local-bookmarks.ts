import type {
  BookmarkArticleSummary,
  BookmarkItem,
  ToggleBookmarkResponse,
} from "@/features/submissions/types/bookmark.types";

export const LOCAL_BOOKMARKS_STORAGE_KEY = "scilab_local_bookmarks";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Public bookmark API only accepts UUID article ids (Postgres uuid column). */
export function isServerBookmarkableArticleId(articleId: string) {
  return UUID_PATTERN.test(articleId.trim());
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readAll(): BookmarkItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_BOOKMARKS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as BookmarkItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: BookmarkItem[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    LOCAL_BOOKMARKS_STORAGE_KEY,
    JSON.stringify(items),
  );
}

export function listLocalBookmarks(): BookmarkItem[] {
  return readAll().sort(
    (left, right) =>
      new Date(right.bookmarkedAt).getTime() -
      new Date(left.bookmarkedAt).getTime(),
  );
}

export function toggleLocalBookmark(input: {
  articleId: string;
  article?: BookmarkArticleSummary;
}): ToggleBookmarkResponse {
  const articleId = input.articleId.trim();
  const existing = readAll();
  const index = existing.findIndex((item) => item.articleId === articleId);

  if (index >= 0) {
    existing.splice(index, 1);
    writeAll(existing);
    return { articleId, bookmarked: false };
  }

  const bookmarkedAt = new Date().toISOString();
  const article: BookmarkArticleSummary = input.article ?? {
    id: articleId,
    title: articleId,
    abstract: null,
    doi: null,
    publicationYear: null,
  };

  existing.unshift({
    articleId,
    bookmarkedAt,
    article: { ...article, id: articleId },
  });
  writeAll(existing);

  return { articleId, bookmarked: true, bookmarkedAt };
}

export function removeLocalBookmark(articleId: string) {
  const next = readAll().filter((item) => item.articleId !== articleId);
  writeAll(next);
}

export function isLocallyBookmarked(articleId: string) {
  return readAll().some((item) => item.articleId === articleId);
}
