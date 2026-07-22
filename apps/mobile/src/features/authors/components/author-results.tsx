import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AcademicLoadMoreButton } from "@/components/academic/academic-load-more-button";
import { AcademicResultsHeader } from "@/components/academic/academic-results-header";
import { ArticleErrorState } from "@/components/academic/article-error-state";
import { AuthorCard } from "@/features/authors/components/author-card";
import type { AuthorListItem } from "@/types/academic.type";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function AuthorResults({
  authors,
  error,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isLoading,
  keyword,
  onLoadMore,
  onRetry,
}: {
  authors: AuthorListItem[];
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
      ) : authors.length === 0 && !isError ? (
        <AuthorEmptyState keyword={keyword} />
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          <AcademicResultsHeader count={authors.length} noun="author" />
          {authors.map((author) => (
            <AuthorCard author={author} key={author.id} />
          ))}
          {hasNextPage ? (
            <AcademicLoadMoreButton
              isLoading={isFetchingNextPage}
              label="Load more authors"
              onPress={onLoadMore}
            />
          ) : null}
        </View>
      )}
    </>
  );
}

function AuthorEmptyState({ keyword }: { keyword: string }) {
  const theme = useAppTheme();
  const hasKeyword = keyword.trim().length > 0;

  return (
    <View
      style={[
        styles.authorEmptyState,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name="people-outline" size={24} />
      <Text
        selectable
        style={[theme.typography.heading, { color: theme.colors.text }]}
      >
        {hasKeyword ? "No matching authors" : "No authors yet"}
      </Text>
      <Text
        selectable
        style={[
          theme.typography.body,
          styles.authorEmptyCopy,
          { color: theme.colors.textMuted },
        ]}
      >
        {hasKeyword
          ? "Try another name or load more authors from the academic graph."
          : "Authors will appear here when the academic index has data."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  authorEmptyCopy: {
    textAlign: "center",
  },
  authorEmptyState: {
    alignItems: "center",
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
});
