import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkItem } from "@/features/submissions/types/bookmark.types";
import { useBookmarks } from "./use-bookmarks";

const { listBookmarksMock, toggleBookmarkMock } = vi.hoisted(() => ({
  listBookmarksMock: vi.fn(),
  toggleBookmarkMock: vi.fn(),
}));

vi.mock("@/features/submissions/api/bookmarks.api", () => ({
  listBookmarks: listBookmarksMock,
  toggleBookmark: toggleBookmarkMock,
}));

describe("useBookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBookmarksMock.mockResolvedValue(emptyPage);
  });

  it("shows Saved immediately and reloads bookmarks when the tab mounts", async () => {
    const savedItem: BookmarkItem = {
      articleId: article.id,
      bookmarkedAt: "2026-07-22T08:00:00.000Z",
      article,
    };
    listBookmarksMock
      .mockResolvedValueOnce(emptyPage)
      .mockResolvedValue({ ...emptyPage, items: [savedItem] });

    let resolveToggle!: (value: {
      articleId: string;
      bookmarked: boolean;
      bookmarkedAt: string;
    }) => void;
    toggleBookmarkMock.mockReturnValue(
      new Promise((resolve) => {
        resolveToggle = resolve;
      }),
    );

    const { queryClient, Wrapper } = createHarness();
    const searchHook = renderHook(() => useBookmarks(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(searchHook.result.current.isLoading).toBe(false),
    );

    let togglePromise!: Promise<unknown>;
    act(() => {
      togglePromise = searchHook.result.current.toggle({
        articleId: article.id,
        article,
      });
    });

    await waitFor(() =>
      expect(
        searchHook.result.current.items.map((item) => item.articleId),
      ).toContain(article.id),
    );
    expect(toggleBookmarkMock).toHaveBeenCalledWith({
      articleId: article.id,
      article,
    });

    await act(async () => {
      resolveToggle({
        articleId: article.id,
        bookmarked: true,
        bookmarkedAt: savedItem.bookmarkedAt,
      });
      await togglePromise;
    });
    expect(listBookmarksMock).toHaveBeenCalledTimes(1);

    searchHook.unmount();
    const bookmarkTabHook = renderHook(() => useBookmarks(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(listBookmarksMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        bookmarkTabHook.result.current.items.map((item) => item.articleId),
      ).toContain(article.id),
    );

    bookmarkTabHook.unmount();
    queryClient.clear();
  });
});

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

const article = {
  id: "article-1",
  title: "Shared bookmark state",
  abstract: "An article saved from the search result list.",
  doi: "10.1000/shared-bookmark",
  publicationYear: 2026,
};

const emptyPage = {
  items: [],
  page: 1,
  limit: 100,
  hasMore: false,
};
