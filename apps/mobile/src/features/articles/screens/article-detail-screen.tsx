import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, type Href, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ArticleErrorState } from "@/components/academic/article-error-state";
import { DetailSection } from "@/components/academic/detail-section";
import { useArticle } from "@/features/articles/hooks/use-article";
import { useArticleRelatedGraph } from "@/features/articles/hooks/use-article-graph";
import type { RelatedArticleGraphNode } from "@/features/articles/types/article-graph.type";
import type {
  ArticleGraph,
  AuthorNode,
  KeywordNode,
  TopicNode,
} from "@/types/academic.type";
import {
  getArticleAuthors,
  getArticleCitationCount,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/articles/utils/article-format";
import { getAuthorDisplayName } from "@/features/authors/utils/author-format";
import { useToast } from "@/components/ui";
import { useBookmarkStatus } from "@/features/bookmarks/hooks/use-bookmarks";
import { useToggleBookmark } from "@/features/bookmarks/hooks/use-toggle-bookmark";
import {
  getFollowedTargetIds,
  useFollows,
} from "@/features/follows/hooks/use-follows";
import { useToggleFollow } from "@/features/follows/hooks/use-toggle-follow";
import type { FollowObjectType } from "@/features/follows/types/follow.type";
import { AppBackButton } from "@/components/navigation/app-back-button";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ArticleDetailScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ articleId?: string }>();
  const articleId = Array.isArray(params.articleId)
    ? params.articleId[0]
    : params.articleId;
  const {
    data: article,
    error,
    isLoading,
    refetch,
  } = useArticle(articleId ?? "");
  const relatedGraphQuery = useArticleRelatedGraph(articleId ?? "", 5);
  const bookmarkStatusQuery = useBookmarkStatus(articleId ?? "");
  const toggleBookmark = useToggleBookmark();
  const serverBookmarked = bookmarkStatusQuery.data ?? false;
  const toggleBookmarkData = toggleBookmark.data;
  const latestToggle =
    toggleBookmarkData && toggleBookmarkData.articleId === articleId
      ? toggleBookmarkData.bookmarked
      : null;
  const isBookmarked = latestToggle ?? serverBookmarked;
  const citationCount = article ? getArticleCitationCount(article) : 0;
  const relatedNodes = useMemo(
    () =>
      getRelatedArticleNodes(relatedGraphQuery.data?.nodes ?? [], articleId),
    [articleId, relatedGraphQuery.data?.nodes],
  );
  const shouldShowRelatedWorks =
    relatedGraphQuery.isLoading ||
    relatedGraphQuery.isError ||
    relatedNodes.length > 0;

  const handleToggleBookmark = () => {
    if (!articleId || toggleBookmark.isPending) {
      return;
    }

    toggleBookmark.mutate(articleId, {
      onError: (mutationError) => {
        showToast(getUserFriendlyApiErrorMessage(mutationError), {
          tone: "error",
        });
      },
      onSuccess: (result) => {
        showToast(
          result.bookmarked
            ? "Article saved to your library."
            : "Article removed from your library.",
          { tone: "success" },
        );
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <View style={styles.headerBackSlot}>
              <AppBackButton variant="brown" />
            </View>
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.primary,
          headerTitleAlign: "center",
          headerTitleStyle: {
            color: theme.colors.primary,
            fontSize: 15,
            fontWeight: "700",
          },
          title: "Paper Details",
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.xl, padding: theme.spacing.xl },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <ArticleErrorState
            message={getUserFriendlyApiErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : article ? (
          <View style={{ gap: theme.spacing.xl }}>
            <View
              style={[
                styles.hero,
                {
                  gap: theme.spacing.lg,
                },
              ]}
            >
              <View style={{ gap: theme.spacing.sm }}>
                <View style={styles.heroMetaRow}>
                  <HeroPill
                    color={theme.colors.success}
                    label="ON READING"
                    softColor={theme.colors.successSoft}
                  />
                  <HeroPill
                    color={theme.colors.primary}
                    label={getArticleYear(article)}
                    softColor={theme.colors.primarySoft}
                  />
                </View>
                <Text
                  selectable
                  style={[
                    theme.typography.display,
                    { color: theme.colors.text, lineHeight: 34 },
                  ]}
                >
                  {getArticleTitle(article)}
                </Text>
              </View>

              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted, lineHeight: 21 },
                ]}
              >
                {getArticleAuthors(article, 6)}
              </Text>

              <View style={styles.metricsGrid}>
                <MetricCard
                  icon="calendar-outline"
                  label="Year"
                  value={getArticleYear(article)}
                />
                <MetricCard
                  icon="people-outline"
                  label="Authors"
                  value={formatCount(article.authors.length)}
                />
                <MetricCard
                  icon="git-branch-outline"
                  label="Cites"
                  value={formatCount(citationCount)}
                />
              </View>
            </View>

            <View style={styles.actionStack}>
              <Pressable
                accessibilityRole="button"
                disabled={toggleBookmark.isPending}
                onPress={handleToggleBookmark}
                style={({ pressed }) => [
                  styles.primaryAction,
                  {
                    backgroundColor: isBookmarked
                      ? theme.colors.primaryPressed
                      : theme.colors.primary,
                    borderRadius: theme.radii.md,
                    opacity: pressed || toggleBookmark.isPending ? 0.82 : 1,
                  },
                ]}
              >
                {toggleBookmark.isPending ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Ionicons
                    color={theme.colors.onPrimary}
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={17}
                  />
                )}
                <Text
                  style={[
                    theme.typography.label,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  {toggleBookmark.isPending
                    ? "Updating..."
                    : isBookmarked
                      ? "Saved to Bookmarks"
                      : "Save to Bookmarks"}
                </Text>
              </Pressable>
            </View>

            <DetailSection icon="book-outline" title="Journal">
              <JournalSummaryCard article={article} />
            </DetailSection>

            <DetailSection icon="reader-outline" title="Abstract">
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, lineHeight: 22 },
                ]}
              >
                {article.article.abstract?.trim() || "Abstract unavailable."}
              </Text>
            </DetailSection>

            <DetailSection icon="people-outline" title="Authors">
              <View style={{ gap: theme.spacing.sm }}>
                {article.authors.length > 0 ? (
                  article.authors.map((author) => (
                    <AuthorRow author={author} key={author.id} />
                  ))
                ) : (
                  <MutedText text="No authors available." />
                )}
              </View>
            </DetailSection>

            <DetailSection icon="pricetags-outline" title="Keywords and topics">
              <View style={{ gap: theme.spacing.md }}>
                <KeywordGroup
                  emptyText="No keywords available."
                  items={article.keywords}
                  label="Keywords"
                />
                <TopicFollowGroup
                  emptyText="No topics available."
                  items={article.topics}
                  label="Topics"
                />
              </View>
            </DetailSection>

            <DetailSection icon="finger-print-outline" title="Metadata">
              <View style={{ gap: theme.spacing.sm }}>
                <InfoRow label="DOI" value={article.article.doi} />
                <InfoRow
                  label="Publisher"
                  value={article.journal?.publisherName}
                />
                <InfoRow
                  label="ISSN"
                  value={article.journal?.issnList?.join(", ")}
                />
                <InfoRow
                  label="Volume / Issue"
                  value={formatVolumeIssue(article)}
                />
                <InfoRow
                  label="Citations"
                  value={citationCount > 0 ? String(citationCount) : null}
                />
              </View>
            </DetailSection>

            {shouldShowRelatedWorks ? (
              <DetailSection
                icon="git-network-outline"
                title="Related scholarly works"
              >
                <RelatedWorks
                  error={relatedGraphQuery.error}
                  isError={relatedGraphQuery.isError}
                  isLoading={relatedGraphQuery.isLoading}
                  nodes={relatedNodes}
                  truncated={relatedGraphQuery.data?.truncated ?? false}
                />
              </DetailSection>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function HeroPill({
  color,
  label,
  softColor,
}: {
  color: string;
  label: string;
  softColor: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.heroPill,
        {
          backgroundColor: softColor,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Text selectable style={[theme.typography.caption, { color }]}>
        {label}
      </Text>
    </View>
  );
}

function KeywordGroup({
  emptyText,
  items,
  label,
}: {
  emptyText: string;
  items: KeywordNode[];
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
        {label.toUpperCase()}
      </Text>
      {items.length === 0 ? (
        <MutedText text={emptyText} />
      ) : (
        <View style={styles.tags}>
          {items.map((item) => (
            <StaticTermChip item={item} key={item.id} />
          ))}
        </View>
      )}
    </View>
  );
}

function TopicFollowGroup({
  emptyText,
  items,
  label,
}: {
  emptyText: string;
  items: TopicNode[];
  label: string;
}) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const objectType: FollowObjectType = "TOPIC";
  const followsQuery = useFollows({ limit: 100, type: objectType });
  const toggleFollow = useToggleFollow();
  const followedTargetIds = useMemo(
    () => getFollowedTargetIds(followsQuery.data),
    [followsQuery.data],
  );
  const pendingObjectId = toggleFollow.variables?.objectId ?? null;

  const handleToggleFollow = (item: TopicNode) => {
    if (toggleFollow.isPending) {
      return;
    }

    toggleFollow.mutate(
      { objectId: item.id, objectType },
      {
        onError: (error) => {
          showToast(getUserFriendlyApiErrorMessage(error), { tone: "error" });
        },
      },
    );
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
        {label.toUpperCase()}
      </Text>
      {items.length === 0 ? (
        <MutedText text={emptyText} />
      ) : (
        <View style={styles.tags}>
          {items.map((item) => (
            <FollowTermChip
              isFollowed={
                toggleFollow.data?.objectId === item.id &&
                toggleFollow.data.objectType === objectType
                  ? toggleFollow.data.followed
                  : followedTargetIds.has(item.id)
              }
              isPending={toggleFollow.isPending && pendingObjectId === item.id}
              item={item}
              key={item.id}
              onPress={() => handleToggleFollow(item)}
            />
          ))}
        </View>
      )}
      <Text style={[theme.typography.caption, { color: theme.colors.outline }]}>
        Tap + to follow a topic.
      </Text>
    </View>
  );
}

function FollowTermChip({
  isFollowed,
  isPending,
  item,
  onPress,
}: {
  isFollowed: boolean;
  isPending: boolean;
  item: TopicNode;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isPending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tag,
        styles.followTag,
        {
          backgroundColor: isFollowed
            ? theme.colors.primarySoft
            : theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.pill,
          opacity: pressed || isPending ? 0.78 : 1,
        },
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : (
        <Ionicons
          color={isFollowed ? theme.colors.primary : theme.colors.textMuted}
          name={isFollowed ? "checkmark" : "add"}
          size={13}
        />
      )}
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          {
            color: isFollowed ? theme.colors.primary : theme.colors.textMuted,
          },
        ]}
      >
        {formatTermLabel(item)}
      </Text>
    </Pressable>
  );
}

function StaticTermChip({ item }: { item: KeywordNode }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {formatTermLabel(item)}
      </Text>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={17} />
      <Text
        numberOfLines={1}
        selectable
        style={[styles.metricValue, { color: theme.colors.text }]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
    </View>
  );
}

function AuthorRow({ author }: { author: AuthorNode }) {
  const theme = useAppTheme();
  const name = getAuthorDisplayName(author);
  const authorHref = `/authors/${encodeURIComponent(author.id)}` as Href;

  return (
    <Link asChild href={authorHref}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.authorRow,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.outlineSoft,
            borderRadius: theme.radii.md,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <View style={styles.authorRowHeader}>
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.label,
              styles.authorRowName,
              { color: theme.colors.text },
            ]}
          >
            {name}
          </Text>
          <Ionicons
            color={theme.colors.textMuted}
            name="chevron-forward"
            size={15}
          />
        </View>
      </Pressable>
    </Link>
  );
}

function JournalSummaryCard({ article }: { article: ArticleGraph }) {
  const theme = useAppTheme();
  const journalHref = article.journal
    ? (`/journals/${encodeURIComponent(article.journal.id)}` as Href)
    : null;
  const content = (
    <>
      <View
        style={[
          styles.journalAccent,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radii.pill,
          },
        ]}
      />
      <View style={styles.journalCopy}>
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {getArticleJournal(article)}
        </Text>
      </View>
    </>
  );

  if (!journalHref) {
    return (
      <View
        style={[
          styles.journalCard,
          {
            backgroundColor: theme.isDark ? "#463029" : "#F2E6E0",
            borderColor: theme.isDark ? "#E2BBAE" : "#805E51",
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Link asChild href={journalHref}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.journalCard,
          {
            backgroundColor: theme.isDark ? "#463029" : "#F2E6E0",
            borderColor: theme.isDark ? "#E2BBAE" : "#805E51",
            borderRadius: theme.radii.lg,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    </Link>
  );
}

function RelatedWorks({
  error,
  isError,
  isLoading,
  nodes,
  truncated,
}: {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  nodes: RelatedArticleGraphNode[];
  truncated: boolean;
}) {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View style={styles.relatedLoading}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return <MutedText text={getUserFriendlyApiErrorMessage(error)} />;
  }

  if (nodes.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {nodes.map((node) => (
        <RelatedWorkCard key={node.id} node={node} />
      ))}
      {truncated ? (
        <MutedText text="More related works are available in the graph." />
      ) : null}
    </View>
  );
}

function RelatedWorkCard({ node }: { node: RelatedArticleGraphNode }) {
  const theme = useAppTheme();
  const articleId = fromArticleGraphNodeId(node.id);
  const href = `/articles/${encodeURIComponent(articleId)}` as Href;
  const title = getRelatedWorkTitle(node.label);
  const year = getRelatedWorkYear(node.label);

  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.relatedCard,
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
        <View style={styles.relatedCardContent}>
          <Text
            numberOfLines={3}
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {[year, `${formatCount(node.citationCount ?? 0)} citations`]
              .filter(Boolean)
              .join(" - ")}
          </Text>
        </View>
        <Ionicons
          color={theme.colors.textMuted}
          name="chevron-forward"
          size={16}
        />
      </Pressable>
    </Link>
  );
}

function uniqueRelatedNodes(nodes: RelatedArticleGraphNode[]) {
  const byId = new Map<string, RelatedArticleGraphNode>();

  for (const node of nodes) {
    if (!byId.has(node.id)) {
      byId.set(node.id, node);
    }
  }

  return Array.from(byId.values());
}

function getRelatedArticleNodes(
  nodes: RelatedArticleGraphNode[],
  articleId: string | null | undefined,
) {
  const rootNodeId = articleId ? toArticleGraphNodeId(articleId) : null;

  return uniqueRelatedNodes(
    nodes.filter((node) => node.type === "article" && node.id !== rootNodeId),
  );
}

function toArticleGraphNodeId(articleId: string) {
  return `article:${articleId}`;
}

function fromArticleGraphNodeId(nodeId: string) {
  return nodeId.startsWith("article:")
    ? nodeId.slice("article:".length)
    : nodeId;
}

function getRelatedWorkTitle(label: string) {
  return label.replace(/\s+\(\d{4}\)$/u, "").trim() || "Untitled article";
}

function getRelatedWorkYear(label: string) {
  return label.match(/\((\d{4})\)$/u)?.[1] ?? null;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.infoRow,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[theme.typography.body, { color: theme.colors.text }]}
      >
        {value?.trim() || "Unavailable"}
      </Text>
    </View>
  );
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

function formatCount(value: number) {
  return value > 0 ? String(value) : "0";
}

function formatVolumeIssue(article: ArticleGraph) {
  const volume = article.article.volumeNumber
    ? `Vol. ${article.article.volumeNumber}`
    : null;
  const issue = article.article.issueNumber
    ? `Issue ${article.article.issueNumber}`
    : null;

  return [volume, issue].filter(Boolean).join(" / ") || null;
}

function formatTermLabel(item: KeywordNode | TopicNode) {
  const label = item.displayName?.trim() || "Unnamed term";
  return label;
}

const styles = StyleSheet.create({
  authorRow: {
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 10,
  },
  authorRowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  authorRowName: {
    flex: 1,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  content: {
    paddingBottom: 36,
  },
  actionStack: {
    gap: 10,
  },
  hero: {
    paddingTop: 4,
  },
  headerBackSlot: {
    marginLeft: 4,
  },
  heroMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  infoRow: {
    gap: 4,
    padding: 12,
  },
  journalCard: {
    alignItems: "center",
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    flexDirection: "row",
    gap: 10,
    minHeight: 72,
    padding: 16,
    width: "100%",
  },
  journalAccent: {
    alignSelf: "stretch",
    width: 4,
  },
  journalCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  metricCard: {
    borderCurve: "continuous",
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 0,
    padding: 10,
  },
  metricValue: {
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 21,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  primaryAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  relatedCard: {
    alignItems: "center",
    borderCurve: "continuous",
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    padding: 12,
  },
  relatedCardContent: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  relatedLoading: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },
  tag: {
    borderWidth: 1,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  followTag: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
