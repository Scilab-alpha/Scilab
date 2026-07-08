import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ArticleCard } from "@/features/academic/components/article-card";
import { ArticleEmptyState } from "@/features/academic/components/article-empty-state";
import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { useArticles } from "@/features/academic/hooks/use-articles";
import { useDebouncedValue } from "@/features/academic/hooks/use-debounced-value";
import { ScreenShell } from "@/features/navigation/components/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function SearchScreen() {
  const theme = useAppTheme();
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useArticles(debouncedKeyword);
  const articles = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  return (
    <ScreenShell
      hideHeader
      subtitle="Search academic articles by keyword and open the works that matter."
      title="Articles"
    >
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineSoft,
          },
        ]}
      >
        <Ionicons color={theme.colors.textMuted} name="search" size={20} />
        <TextInput
          accessibilityLabel="Search articles"
          onChangeText={setKeyword}
          placeholder="Keyword, topic or title"
          placeholderTextColor={theme.colors.outline}
          style={[styles.input, { color: theme.colors.text }]}
          value={keyword}
        />
        {keyword ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => setKeyword("")}
          >
            <Ionicons
              color={theme.colors.textMuted}
              name="close-circle"
              size={20}
            />
          </Pressable>
        ) : null}
      </View>

      {isError ? (
        <ArticleErrorState
          message={getUserFriendlyApiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : articles.length === 0 && !isError ? (
        <ArticleEmptyState keyword={debouncedKeyword} />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          <View style={styles.resultsHeader}>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              {articles.length} RESULT{articles.length === 1 ? "" : "S"}
            </Text>
            {debouncedKeyword ? (
              <Text
                numberOfLines={1}
                selectable
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textMuted,
                    flex: 1,
                    textAlign: "right",
                  },
                ]}
              >
                {debouncedKeyword}
              </Text>
            ) : null}
          </View>
          {articles.map((article) => (
            <ArticleCard article={article} key={article.article.id} />
          ))}
          {hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              disabled={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
              style={({ pressed }) => [
                styles.loadMoreButton,
                {
                  backgroundColor: pressed
                    ? theme.colors.surfaceMuted
                    : theme.colors.surface,
                  borderColor: theme.colors.outlineSoft,
                  borderRadius: theme.radii.sm,
                  opacity: isFetchingNextPage ? 0.7 : 1,
                },
              ]}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <Text
                    style={[
                      theme.typography.label,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Load more
                  </Text>
                  <Ionicons
                    color={theme.colors.primary}
                    name="chevron-down"
                    size={16}
                  />
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 12 },
  loadMoreButton: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
  },
  loadingState: {
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
