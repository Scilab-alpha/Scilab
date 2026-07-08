import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  getArticleAbstractPreview,
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getTagNames,
} from "@/features/academic/utils/article-format";
import { useAppTheme } from "@/theme";

import type { ArticleGraph } from "@/features/academic/types/article.type";

type ArticleCardProps = {
  article: ArticleGraph;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const theme = useAppTheme();
  const tags = getTagNames([...article.keywords, ...article.topics], 3);
  const articleHref = `/articles/${encodeURIComponent(
    article.article.id,
  )}` as Href;

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
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              numberOfLines={2}
              selectable
              style={[theme.typography.heading, { color: theme.colors.text }]}
            >
              {getArticleTitle(article)}
            </Text>
            <Text
              numberOfLines={1}
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              {getArticleYear(article)} · {getArticleJournal(article)}
            </Text>
          </View>
          <Ionicons
            color={theme.colors.textMuted}
            name="chevron-forward"
            size={18}
          />
        </View>

        <Text
          numberOfLines={2}
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {getArticleAuthors(article)}
        </Text>

        <Text
          numberOfLines={3}
          selectable
          style={[theme.typography.body, { color: theme.colors.text }]}
        >
          {getArticleAbstractPreview(article)}
        </Text>

        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.primary },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
