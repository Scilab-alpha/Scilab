import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ArticleGraph } from "@/types/academic.type";
import {
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/articles/utils/article-format";
import type { BookmarkedArticle } from "@/features/bookmarks/types/bookmark.type";
import { SurfaceCard } from "@/components/layout/screen-shell";
import { useAppTheme } from "@/theme";

import { EmptyBlock, LoadingBlock } from "./dashboard-state-block";

export function RecentlySavedContent({
  isError,
  isLoading,
  savedArticles,
}: {
  isError: boolean;
  isLoading: boolean;
  savedArticles: BookmarkedArticle[];
}) {
  if (isLoading) {
    return (
      <SurfaceCard>
        <LoadingBlock label="Loading saved papers..." />
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="Please try again when your library is available."
          icon="warning-outline"
          title="Could not load saved papers"
        />
      </SurfaceCard>
    );
  }

  if (savedArticles.length === 0) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="Saved papers from article details will appear here."
          icon="bookmark-outline"
          title="No saved papers yet"
        />
      </SurfaceCard>
    );
  }

  return (
    <View style={styles.savedPaperList}>
      {savedArticles.map((bookmark) => (
        <SavedPaperRow bookmark={bookmark} key={bookmark.articleId} />
      ))}
    </View>
  );
}

export function LatestPapersContent({
  articles,
  isError,
  isLoading,
}: {
  articles: ArticleGraph[];
  isError: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SurfaceCard>
        <LoadingBlock label="Loading latest papers..." />
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="Please try again when the academic service is available."
          icon="warning-outline"
          title="Could not load papers"
        />
      </SurfaceCard>
    );
  }

  if (articles.length === 0) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="New papers will appear here after the catalog has data."
          icon="document-text-outline"
          title="Nothing new yet"
        />
      </SurfaceCard>
    );
  }

  return (
    <View style={styles.latestPaperList}>
      {articles.map((article) => (
        <LatestPaperRow article={article} key={article.article.id} />
      ))}
    </View>
  );
}

function SavedPaperRow({ bookmark }: { bookmark: BookmarkedArticle }) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    bookmark.articleId,
  )}` as Href;

  return (
    <View
      style={[
        styles.savedPaperCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: 0,
        },
      ]}
    >
      <Link asChild href={articleHref}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.savedPaperButton,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <View style={styles.paperTitleRow}>
            <Ionicons
              color={theme.colors.primary}
              name="bookmark"
              size={18}
              style={styles.paperTitleIcon}
            />
            <View style={styles.savedPaperCopy}>
              <Text
                numberOfLines={2}
                selectable
                style={[
                  theme.typography.heading,
                  styles.paperTitle,
                  styles.paperTitleText,
                  { color: theme.colors.text },
                ]}
              >
                {getArticleTitle(bookmark.article)}
              </Text>
              <Text
                numberOfLines={2}
                selectable
                style={[
                  styles.savedPaperMeta,
                  { color: theme.colors.textMuted },
                ]}
              >
                {getArticleJournal(bookmark.article)} -{" "}
                {formatSavedAt(bookmark.bookmarkedAt)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

function LatestPaperRow({ article }: { article: ArticleGraph }) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    article.article.id,
  )}` as Href;

  return (
    <View
      style={[
        styles.latestPaperCard,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: 0,
        },
      ]}
    >
      <Link asChild href={articleHref}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.latestPaperButton,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <View
            style={[
              styles.latestYearBadge,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: 0,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              selectable
              style={[styles.latestYearText, { color: theme.colors.primary }]}
            >
              {getArticleYear(article)}
            </Text>
          </View>

          <View style={styles.latestPaperCopy}>
            <Text
              numberOfLines={3}
              selectable
              style={[
                theme.typography.heading,
                styles.latestPaperTitle,
                { color: theme.colors.text },
              ]}
            >
              {getArticleTitle(article)}
            </Text>
            <View style={styles.latestPaperMeta}>
              <Text
                numberOfLines={1}
                selectable
                style={[styles.latestJournal, { color: theme.colors.primary }]}
              >
                {getArticleJournal(article)}
              </Text>
              <Text
                numberOfLines={1}
                selectable
                style={[styles.paperAuthors, { color: theme.colors.textMuted }]}
              >
                {getArticleAuthors(article)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return `Saved ${new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date)}`;
}

const styles = StyleSheet.create({
  latestJournal: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    maxWidth: "100%",
  },
  latestPaperButton: {
    gap: 16,
  },
  latestPaperCard: {
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(43, 24, 18, 0.06)",
    padding: 20,
    width: "100%",
  },
  latestPaperCopy: {
    alignSelf: "stretch",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
  },
  latestPaperList: {
    gap: 12,
  },
  latestPaperMeta: {
    gap: 3,
    maxWidth: "100%",
    minWidth: 0,
  },
  latestPaperTitle: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 22,
    maxWidth: "100%",
  },
  latestYearBadge: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    paddingHorizontal: 8,
    width: 52,
  },
  latestYearText: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 15,
  },
  paperAuthors: {
    flexShrink: 1,
    fontSize: 10,
    fontStyle: "italic",
    lineHeight: 14,
    maxWidth: "100%",
  },
  paperTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  paperTitleIcon: {
    marginTop: 2,
  },
  paperTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  paperTitleText: {
    flex: 1,
    minWidth: 0,
  },
  savedPaperButton: {
    gap: 12,
  },
  savedPaperCard: {
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(43, 24, 18, 0.06)",
    padding: 20,
  },
  savedPaperCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  savedPaperList: {
    gap: 14,
  },
  savedPaperMeta: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
});
