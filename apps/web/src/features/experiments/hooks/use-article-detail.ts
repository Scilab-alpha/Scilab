"use client";

import { useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { getArticleById } from "@/features/experiments/api/articles.api";
import type { ArticleGraph } from "@/features/experiments/types/article.types";

export function useArticleDetail(articleId: string) {
  const [article, setArticle] = useState<ArticleGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getArticleById(articleId);

        if (!cancelled) {
          setArticle(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setArticle(null);
          setError(getUserFriendlyApiErrorMessage(fetchError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return { article, isLoading, error };
}
