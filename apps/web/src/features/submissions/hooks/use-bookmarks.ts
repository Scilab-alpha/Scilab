"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  listBookmarks,
  toggleBookmark,
} from "@/features/submissions/api/bookmarks.api";
import type { BookmarkItem } from "@/features/submissions/types/bookmark.types";

export function useBookmarks() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await listBookmarks({ page: 1, limit: 50 });
      setItems(page.items);
    } catch (fetchError) {
      setItems([]);
      setError(getUserFriendlyApiErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const remove = useCallback(async (articleId: string) => {
    const result = await toggleBookmark({ articleId });

    if (!result.bookmarked) {
      setItems((prev) => prev.filter((item) => item.articleId !== articleId));
    }

    return result;
  }, []);

  return {
    items,
    isLoading,
    error,
    reload,
    remove,
  };
}
