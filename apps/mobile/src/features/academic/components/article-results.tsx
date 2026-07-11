import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AcademicLoadMoreButton } from "@/features/academic/components/academic-load-more-button";
import { AcademicResultsHeader } from "@/features/academic/components/academic-results-header";
import { ArticleCard } from "@/features/academic/components/article-card";
import { ArticleEmptyState } from "@/features/academic/components/article-empty-state";
import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import type { ArticleGraph } from "@/features/academic/types/article.type";
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
            <ArticleCard article={article} key={article.article.id} />
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
