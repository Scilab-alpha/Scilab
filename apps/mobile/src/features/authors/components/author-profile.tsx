import { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";

import { useArticles } from "@/features/articles/hooks/use-articles";
import {
  getArticleCitationCount,
  getArticleTitle,
  getArticleYear,
} from "@/features/articles/utils/article-format";
import { AuthorAvatar } from "@/features/authors/components/author-card";
import {
  DetailSection,
  StatusBadge,
} from "@/components/academic/detail-section";
import type { ArticleGraph, AuthorListItem } from "@/types/academic.type";
import { getAuthorDisplayName } from "@/features/authors/utils/author-format";
import { FollowButton } from "@/features/follows/components/follow-button";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function AuthorProfile({ author }: { author: AuthorListItem }) {
  const theme = useAppTheme();
  const name = getAuthorDisplayName(author);
  const articlesQuery = useArticles({ authorId: author.id, sort: "newest" });
  const articles = useMemo(
    () => articlesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [articlesQuery.data],
  );

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={styles.hero}>
        <AuthorAvatar imageUrl={author.imageUrl} name={name} size={84} />
        <View style={styles.heroContent}>
          <Text
            numberOfLines={2}
            selectable
            style={[
              theme.typography.display,
              styles.heroName,
              { color: theme.colors.text },
            ]}
          >
            {name}
          </Text>
          <View style={styles.badgeRow}>
            {author.orcid ? <StatusBadge label="ORCID linked" /> : null}
          </View>
          <FollowButton
            label="Follow author"
            objectId={author.id}
            objectType="AUTHOR"
          />
        </View>
      </View>

      {author.orcid ? (
        <DetailSection icon="finger-print-outline" title="Identifiers">
          <OrcidLink orcid={author.orcid} />
        </DetailSection>
      ) : null}

      <DetailSection icon="document-text-outline" title="Articles">
        <AuthorArticleList
          articles={articles}
          error={articlesQuery.error}
          hasNextPage={articlesQuery.hasNextPage}
          isError={articlesQuery.isError}
          isFetchingNextPage={articlesQuery.isFetchingNextPage}
          isLoading={articlesQuery.isLoading}
          onLoadMore={() => void articlesQuery.fetchNextPage()}
          onRetry={() => void articlesQuery.refetch()}
        />
      </DetailSection>
    </View>
  );
}

function AuthorArticleList({
  articles,
  error,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isLoading,
  onLoadMore,
  onRetry,
}: {
  articles: ArticleGraph[];
  error: unknown;
  hasNextPage?: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View style={styles.articleLoading}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.articleNotice,
          {
            backgroundColor: pressed
              ? theme.colors.surface
              : theme.colors.surfaceMuted,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <Text
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {getUserFriendlyApiErrorMessage(error)}
        </Text>
        <Text
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          Tap to retry
        </Text>
      </Pressable>
    );
  }

  if (articles.length === 0) {
    return <MutedText text="No articles available for this author." />;
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {articles.map((article) => (
        <AuthorArticleRow article={article} key={article.article.id} />
      ))}
      {hasNextPage ? (
        <Pressable
          accessibilityRole="button"
          disabled={isFetchingNextPage}
          onPress={onLoadMore}
          style={({ pressed }) => [
            styles.loadMoreArticles,
            {
              backgroundColor: pressed
                ? theme.colors.surface
                : theme.colors.surfaceMuted,
              borderRadius: theme.radii.md,
              opacity: isFetchingNextPage ? 0.72 : 1,
            },
          ]}
        >
          {isFetchingNextPage ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <Text
              style={[theme.typography.label, { color: theme.colors.primary }]}
            >
              Load more articles
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function AuthorArticleRow({ article }: { article: ArticleGraph }) {
  const theme = useAppTheme();
  const href = `/articles/${encodeURIComponent(article.article.id)}` as Href;
  const meta = [
    getArticleYear(article),
    `${getArticleCitationCount(article)} citations`,
  ].filter((item) => item && item !== "No year");

  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.articleRow,
          {
            backgroundColor: pressed
              ? theme.colors.surface
              : theme.colors.surfaceMuted,
            borderColor: theme.colors.outlineSoft,
            borderRadius: theme.radii.md,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <View style={styles.articleRowCopy}>
          <Text
            numberOfLines={2}
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {getArticleTitle(article)}
          </Text>
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {meta.join(" - ")}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function OrcidLink({ orcid }: { orcid: string }) {
  const theme = useAppTheme();
  const href = formatOrcidUrl(orcid);

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(href)}
      style={({ pressed }) => [
        styles.orcidLink,
        {
          backgroundColor: pressed
            ? theme.colors.surface
            : theme.colors.surfaceMuted,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <View style={styles.orcidCopy}>
        <Text
          numberOfLines={1}
          style={[theme.typography.caption, { color: theme.colors.textMuted }]}
        >
          ORCID
        </Text>
        <Text
          numberOfLines={1}
          selectable
          style={[theme.typography.body, { color: theme.colors.primary }]}
        >
          {orcid}
        </Text>
      </View>
      <Ionicons color={theme.colors.primary} name="open-outline" size={16} />
    </Pressable>
  );
}

function formatOrcidUrl(orcid: string) {
  const value = orcid.trim();

  if (/^https?:\/\//iu.test(value)) {
    return value;
  }

  return `https://orcid.org/${value.replace(/^orcid:/iu, "")}`;
}

function MutedText({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <Text
      selectable
      style={[theme.typography.body, { color: theme.colors.textMuted }]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  articleLoading: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },
  articleNotice: {
    gap: 5,
    padding: 12,
  },
  articleRow: {
    alignItems: "center",
    borderCurve: "continuous",
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  articleRowCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  heroContent: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  heroName: {
    lineHeight: 30,
  },
  orcidCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  orcidLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  loadMoreArticles: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
});
