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
      <View style={{ gap: theme.spacing.lg }}>
        <Text
          selectable
          style={[
            theme.typography.display,
            styles.title,
            { color: theme.colors.text },
          ]}
        >
          Discover Research
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineSoft,
            },
          ]}
        >
          <Ionicons color={theme.colors.textMuted} name="search" size={18} />
          <TextInput
            accessibilityLabel="Search articles"
            onChangeText={setKeyword}
            placeholder="Search by title, keywords, or DOI..."
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

        <View style={styles.filters}>
          {["All", "Author", "Journal", "Keywords"].map((filter, index) => (
            <View
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    index === 0
                      ? theme.colors.primarySoft
                      : theme.colors.surface,
                  borderColor:
                    index === 0
                      ? theme.colors.primarySoft
                      : theme.colors.outlineSoft,
                  borderRadius: theme.radii.pill,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  theme.typography.caption,
                  {
                    color:
                      index === 0
                        ? theme.colors.primary
                        : theme.colors.textMuted,
                  },
                ]}
              >
                {filter}
              </Text>
            </View>
          ))}
          <View
            style={[
              styles.filterChip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineSoft,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Ionicons
              color={theme.colors.textMuted}
              name="options-outline"
              size={12}
            />
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              Advanced
            </Text>
          </View>
        </View>
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
        <View style={{ gap: theme.spacing.lg }}>
          <View style={styles.resultsHeader}>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              Showing {articles.length} result{articles.length === 1 ? "" : "s"}
            </Text>
            <View style={styles.sortControl}>
              <Text
                numberOfLines={1}
                selectable
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.primary,
                  },
                ]}
              >
                Most Relevant
              </Text>
              <Ionicons
                color={theme.colors.primary}
                name="chevron-down"
                size={12}
              />
            </View>
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
  filterChip: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 12,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  searchBox: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 13, paddingVertical: 10 },
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
    gap: 12,
    justifyContent: "space-between",
  },
  sortControl: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
});
