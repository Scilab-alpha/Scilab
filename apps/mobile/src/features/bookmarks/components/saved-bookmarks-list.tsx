import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { AcademicLoadMoreButton } from "@/components/academic/academic-load-more-button";
import { ArticleErrorState } from "@/components/academic/article-error-state";
import type { ArticleGraph } from "@/types/academic.type";
import {
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/articles/utils/article-format";
import { useBookmarks } from "@/features/bookmarks/hooks/use-bookmarks";
import { SurfaceCard } from "@/components/layout/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function SavedBookmarksList() {
  const theme = useAppTheme();
  const bookmarksQuery = useBookmarks();
  const bookmarks = useMemo(
    () => bookmarksQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bookmarksQuery.data],
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      {bookmarksQuery.isError ? (
        <ArticleErrorState
          message={getUserFriendlyApiErrorMessage(bookmarksQuery.error)}
          onRetry={() => void bookmarksQuery.refetch()}
        />
      ) : null}

      {bookmarksQuery.isLoading ? (
        <SurfaceCard>
          <View style={{ alignItems: "center", minHeight: 80 }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        </SurfaceCard>
      ) : bookmarks.length === 0 && !bookmarksQuery.isError ? (
        <SavedBookmarksEmptyState />
      ) : (
        bookmarks.map((bookmark) => (
          <SavedBookmarkCard
            article={bookmark.article}
            bookmarkedAt={bookmark.bookmarkedAt}
            key={bookmark.articleId}
          />
        ))
      )}

      {bookmarksQuery.hasNextPage ? (
        <AcademicLoadMoreButton
          isLoading={bookmarksQuery.isFetchingNextPage}
          label="Load more saved articles"
          onPress={() => void bookmarksQuery.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

function SavedBookmarksEmptyState() {
  const theme = useAppTheme();

  return (
    <SurfaceCard>
      <View style={{ alignItems: "center", gap: 8, padding: 8 }}>
        <Ionicons
          color={theme.colors.primary}
          name="bookmark-outline"
          size={28}
        />
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          No saved articles yet
        </Text>
        <Text
          selectable
          style={[
            theme.typography.body,
            {
              color: theme.colors.textMuted,
              textAlign: "center",
            },
          ]}
        >
          Save papers from article details and they will appear here.
        </Text>
      </View>
    </SurfaceCard>
  );
}

function SavedBookmarkCard({
  article,
  bookmarkedAt,
}: {
  article: ArticleGraph;
  bookmarkedAt: string;
}) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    article.article.id,
  )}` as Href;
  const meta = [
    getArticleJournal(article),
    getArticleYear(article),
    formatSavedAt(bookmarkedAt),
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <Link asChild href={articleHref}>
      <Pressable accessibilityRole="button">
        <SurfaceCard>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Ionicons color={theme.colors.primary} name="bookmark" size={20} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                numberOfLines={2}
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                {getArticleTitle(article)}
              </Text>
              <Text
                numberOfLines={2}
                selectable
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted },
                ]}
              >
                {meta}
              </Text>
            </View>
          </View>
        </SurfaceCard>
      </Pressable>
    </Link>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `Saved ${new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date)}`;
}
