import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/academic/utils/article-format";
import { useAppTheme } from "@/theme";

import type { ArticleGraph } from "@/features/academic/types/article.type";

type ArticleCardProps = {
  article: ArticleGraph;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    article.article.id,
  )}` as Href;
  const journal = getArticleJournal(article);
  const publishedAt = formatPublishedAt(article);
  const citationLabel = formatCitations(article.citedArticleIds.length);

  return (
    <Link asChild href={articleHref}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineSoft,
            borderRadius: theme.radii.lg,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.caption,
              styles.yearBadge,
              {
                backgroundColor: theme.colors.primarySoft,
                color: theme.colors.primary,
              },
            ]}
          >
            {getArticleYear(article)}
          </Text>
          <Ionicons
            color={theme.colors.primary}
            name="bookmark-outline"
            size={17}
          />
        </View>

        <View style={{ gap: 7 }}>
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
          <View style={styles.metaItem}>
            <Ionicons
              color={theme.colors.textMuted}
              name="calendar-outline"
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
              {publishedAt}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={1}
          selectable
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          {citationLabel}
        </Text>
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
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  authors: {
    fontStyle: "italic",
    lineHeight: 18,
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
    gap: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  metaText: {
    flexShrink: 1,
  },
  yearBadge: {
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
});
