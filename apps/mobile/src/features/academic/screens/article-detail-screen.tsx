import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { useArticle } from "@/features/academic/hooks/use-article";
import type {
  ArticleGraph,
  AuthorNode,
  KeywordNode,
  TopicNode,
} from "@/features/academic/types/article.type";
import {
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getAuthorDisplayName,
} from "@/features/academic/utils/article-format";
import { AppBackButton } from "@/features/navigation/components/app-back-button";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ArticleDetailScreen() {
  const theme = useAppTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
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
                  value={formatCount(article.citedArticleIds.length)}
                />
              </View>
            </View>

            <View style={styles.actionStack}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsBookmarked((current) => !current)}
                style={({ pressed }) => [
                  styles.primaryAction,
                  {
                    backgroundColor: isBookmarked
                      ? theme.colors.primaryPressed
                      : theme.colors.primary,
                    borderRadius: theme.radii.md,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Ionicons
                  color={theme.colors.onPrimary}
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={17}
                />
                <Text
                  style={[
                    theme.typography.label,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  {isBookmarked ? "Saved to Bookmarks" : "Save to Bookmarks"}
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.journalCard,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radii.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.journalIcon,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <Ionicons
                  color={theme.colors.primary}
                  name="journal-outline"
                  size={20}
                />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  selectable
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.primary },
                  ]}
                >
                  JOURNAL
                </Text>
                <Text
                  selectable
                  style={[theme.typography.label, { color: theme.colors.text }]}
                >
                  {getArticleJournal(article)}
                </Text>
              </View>
            </View>

            <DetailSection title="Abstract">
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

            <DetailSection title="Authors">
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
                <TermGroup
                  emptyText="No keywords available."
                  items={article.keywords}
                  label="Keywords"
                />
                <TermGroup
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
                  label="Open access"
                  value={formatOpenAccess(article)}
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
                  value={
                    article.citedArticleIds.length > 0
                      ? String(article.citedArticleIds.length)
                      : null
                  }
                />
              </View>
            </DetailSection>

            <DetailSection
              icon="git-network-outline"
              title="Related scholarly works"
            >
              <CitationLinks article={article} />
            </DetailSection>
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

function DetailSection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.section, { gap: theme.spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionRule,
            { backgroundColor: theme.colors.primary },
          ]}
        />
        {icon ? (
          <Ionicons color={theme.colors.primary} name={icon} size={17} />
        ) : null}
        <Text
          selectable
          style={[theme.typography.heading, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function TermGroup({
  emptyText,
  items,
  label,
}: {
  emptyText: string;
  items: (KeywordNode | TopicNode)[];
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
            <View
              key={item.id}
              style={[
                styles.tag,
                {
                  backgroundColor:
                    "isPrimary" in item && item.isPrimary
                      ? theme.colors.primarySoft
                      : theme.colors.surfaceMuted,
                  borderColor: theme.colors.outlineSoft,
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
                      "isPrimary" in item && item.isPrimary
                        ? theme.colors.primary
                        : theme.colors.textMuted,
                  },
                ]}
              >
                {formatTermLabel(item)}
              </Text>
            </View>
          ))}
        </View>
      )}
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

  return (
    <View
      style={[
        styles.authorRow,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        selectable
        style={[theme.typography.label, { color: theme.colors.text }]}
      >
        {name}
      </Text>
      {author.orcid ? (
        <View style={styles.orcidRow}>
          <View
            style={[
              styles.orcidBadge,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineSoft,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              ORCID
            </Text>
          </View>
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted, flex: 1 },
            ]}
          >
            {author.orcid}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CitationLinks({ article }: { article: ArticleGraph }) {
  const theme = useAppTheme();
  const citedIds = article.citedArticleIds.slice(0, 5);

  if (citedIds.length === 0) {
    return (
      <MutedText text="No citation graph links are available for this article." />
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {citedIds.map((citedId, index) => (
        <View
          key={citedId}
          style={[
            styles.relatedCard,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <Text
            selectable
            numberOfLines={1}
            style={[theme.typography.caption, { color: theme.colors.primary }]}
          >
            CITES NODE {index + 1}
          </Text>
          <Text
            selectable
            numberOfLines={2}
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {citedId}
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            Linked through the article citation graph.
          </Text>
        </View>
      ))}
      {article.citedArticleIds.length > citedIds.length ? (
        <MutedText
          text={`+${article.citedArticleIds.length - citedIds.length} more citation links in the graph.`}
        />
      ) : null}
    </View>
  );
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

function formatOpenAccess(article: ArticleGraph) {
  if (!article.journal) {
    return null;
  }

  if (article.journal.isOaDiamond) {
    return "Diamond open access";
  }

  if (article.journal.isOpenAccess === true) {
    return "Open access";
  }

  if (article.journal.isOpenAccess === false) {
    return "Not open access";
  }

  return null;
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
  const score =
    typeof item.score === "number" ? ` ${item.score.toFixed(2)}` : "";

  if ("isPrimary" in item && item.isPrimary) {
    return `${label} primary${score}`;
  }

  return `${label}${score}`;
}

const styles = StyleSheet.create({
  authorRow: {
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 6,
    padding: 10,
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
    borderCurve: "continuous",
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  journalIcon: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  metricCard: {
    borderCurve: "continuous",
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 0,
    padding: 10,
  },
  orcidBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  orcidRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
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
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  section: {
    paddingVertical: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sectionRule: {
    height: 1,
    width: 22,
  },
  tag: {
    borderWidth: 1,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
