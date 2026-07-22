import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";

import { useToast } from "@/components/ui";
import { AcademicLoadMoreButton } from "@/components/academic/academic-load-more-button";
import { AcademicResultsHeader } from "@/components/academic/academic-results-header";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleEmptyState } from "@/features/articles/components/article-empty-state";
import { ArticleErrorState } from "@/components/academic/article-error-state";
import type { ArticleGraph } from "@/types/academic.type";
import {
  getBookmarkedArticleIds,
  useBookmarks,
} from "@/features/bookmarks/hooks/use-bookmarks";
import { useToggleBookmark } from "@/features/bookmarks/hooks/use-toggle-bookmark";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ArticleResults({
  articles,
  error,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isLoading,
  keyword,
  onLoadMore,
  onRetry,
}: {
  articles: ArticleGraph[];
  error: unknown;
  hasNextPage?: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  keyword: string;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<
    Record<string, boolean>
  >({});
  const bookmarksQuery = useBookmarks();
  const toggleBookmark = useToggleBookmark();
  const bookmarkedArticleIds = useMemo(
    () => getBookmarkedArticleIds(bookmarksQuery.data),
    [bookmarksQuery.data],
  );
  const pendingArticleId = toggleBookmark.variables ?? null;
  const isArticleBookmarked = (articleId: string) =>
    optimisticBookmarks[articleId] ?? bookmarkedArticleIds.has(articleId);
  const handleToggleBookmark = (article: ArticleGraph) => {
    const articleId = article.article.id;
    const wasBookmarked = isArticleBookmarked(articleId);

    setOptimisticBookmarks((current) => ({
      ...current,
      [articleId]: !wasBookmarked,
    }));

    toggleBookmark.mutate(articleId, {
      onError: (mutationError) => {
        setOptimisticBookmarks((current) => {
          const next = { ...current };
          delete next[articleId];
          return next;
        });
        showToast(getUserFriendlyApiErrorMessage(mutationError), {
          tone: "error",
        });
      },
      onSuccess: (result) => {
        setOptimisticBookmarks((current) => ({
          ...current,
          [result.articleId]: result.bookmarked,
        }));
      },
    });
  };

  return (
    <>
      {isError ? (
        <ArticleErrorState
          message={getUserFriendlyApiErrorMessage(error)}
          onRetry={onRetry}
        />
      ) : null}

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : articles.length === 0 && !isError ? (
        <ArticleEmptyState keyword={keyword} />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <AcademicResultsHeader count={articles.length} noun="result" />
          {articles.map((article) => (
            <ArticleCard
              article={article}
              isBookmarkPending={
                toggleBookmark.isPending &&
                pendingArticleId === article.article.id
              }
              isBookmarked={isArticleBookmarked(article.article.id)}
              key={article.article.id}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
          {hasNextPage ? (
            <AcademicLoadMoreButton
              isLoading={isFetchingNextPage}
              label="Load more"
              onPress={onLoadMore}
            />
          ) : null}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
});
