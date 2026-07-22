import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

import {
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/articles/utils/article-format";
import { useAppTheme } from "@/theme";

import type { ArticleGraph } from "@/types/academic.type";

type ArticleCardProps = {
  article: ArticleGraph;
  isBookmarkPending?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (article: ArticleGraph) => void;
};

export function ArticleCard({
  article,
  isBookmarkPending = false,
  isBookmarked = false,
  onToggleBookmark,
}: ArticleCardProps) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    article.article.id,
  )}` as Href;
  const journal = getArticleJournal(article);
  const publishedAt = formatPublishedAt(article);
  const citationLabel = formatCitations(article.citedArticleIds.length);
  const handleToggleBookmark = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onToggleBookmark?.(article);
  };

  return (
    <Link asChild href={articleHref}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed
              ? theme.colors.surfaceMuted
              : "transparent",
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.topMetaRow}>
            <Text
              numberOfLines={1}
              selectable
              style={[
                theme.typography.caption,
                styles.primaryMeta,
                { color: theme.colors.primary },
              ]}
            >
              {publishedAt}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={
              isBookmarked ? "Remove bookmark" : "Save bookmark"
            }
            accessibilityRole="button"
            disabled={isBookmarkPending || !onToggleBookmark}
            hitSlop={10}
            onPress={handleToggleBookmark}
            style={({ pressed }) => [
              styles.bookmarkButton,
              {
                backgroundColor: isBookmarked
                  ? theme.colors.primarySoft
                  : "transparent",
                borderRadius: theme.radii.pill,
                opacity: pressed || isBookmarkPending ? 0.75 : 1,
              },
            ]}
          >
            {isBookmarkPending ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <Ionicons
                color={theme.colors.primary}
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={17}
              />
            )}
          </Pressable>
        </View>

        <View style={styles.copyBlock}>
          <Text
            numberOfLines={3}
            selectable
            style={[
              theme.typography.heading,
              styles.title,
              { color: theme.colors.text },
            ]}
          >
            {getArticleTitle(article)}
          </Text>
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.body,
              styles.authors,
              { color: theme.colors.textMuted },
            ]}
          >
            {getArticleAuthors(article)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              color={theme.colors.textMuted}
              name="book-outline"
              size={12}
            />
            <Text
              numberOfLines={1}
              selectable
              style={[
                theme.typography.caption,
                styles.metaText,
                { color: theme.colors.textMuted },
              ]}
            >
              {journal}
            </Text>
          </View>
          <View
            style={[
              styles.metaDot,
              { backgroundColor: theme.colors.outlineSoft },
            ]}
          />
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {citationLabel}
          </Text>
        </View>
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.colors.outlineSoft },
          ]}
        />
      </Pressable>
    </Link>
  );
}

function formatPublishedAt(article: ArticleGraph) {
  const timestamp = article.article.createdAt ?? article.article.updatedAt;

  if (timestamp) {
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric",
      }).format(date);
    }
  }

  return getArticleYear(article);
}

function formatCitations(count: number) {
  return `${count} Citation${count === 1 ? "" : "s"}`;
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    paddingBottom: 0,
    paddingTop: 12,
  },
  copyBlock: {
    gap: 7,
  },
  divider: {
    height: 1,
    marginTop: 7,
    width: "100%",
  },
  authors: {
    fontStyle: "italic",
    lineHeight: 18,
  },
  bookmarkButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    maxWidth: "100%",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  topMetaRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: 0,
  },
  metaText: {
    flexShrink: 1,
  },
  metaDot: {
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  primaryMeta: {
    fontWeight: "700",
  },
});
