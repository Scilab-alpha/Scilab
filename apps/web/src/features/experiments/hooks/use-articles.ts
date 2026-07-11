"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listArticles } from "@/features/experiments/api/articles.api";
import type { ArticleGraph } from "@/features/experiments/types/article.types";

const pageFetchLimit = 50;
const maxArticles = 200;

export function useArticles(keyword: string) {
  const [items, setItems] = useState<ArticleGraph[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const collected: ArticleGraph[] = [];
      let cursor: string | null = null;

      do {
        const page = await listArticles({
          keyword: keyword.trim() || undefined,
          limit: pageFetchLimit,
          cursor,
        });

        collected.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor && collected.length < maxArticles);

      setItems(collected);
    } catch (fetchError) {
      setItems([]);
      setError(getUserFriendlyApiErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    isLoading,
    error,
    reload,
  };
}
