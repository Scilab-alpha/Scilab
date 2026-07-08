import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { useArticle } from "@/features/academic/hooks/use-article";
import {
  getArticleAuthors,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getAuthorDisplayName,
  getTagNames,
} from "@/features/academic/utils/article-format";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ArticleDetailScreen() {
  const theme = useAppTheme();
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
          headerShown: true,
          title: article ? getArticleYear(article) : "Article",
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.xl, padding: theme.spacing.xl },
        ]}
        contentInsetAdjustmentBehavior="automatic"
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
          <>
            <View style={{ gap: theme.spacing.md }}>
              <Text
                selectable
                style={[theme.typography.display, { color: theme.colors.text }]}
              >
                {getArticleTitle(article)}
              </Text>
              <View style={styles.metaRow}>
                <MetaPill
                  icon="calendar-outline"
                  label={getArticleYear(article)}
                />
                <MetaPill
                  icon="journal-outline"
                  label={getArticleJournal(article)}
                />
              </View>
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted },
                ]}
              >
                {getArticleAuthors(article, 6)}
              </Text>
            </View>

            <DetailSection title="Abstract">
              <Text
                selectable
                style={[theme.typography.body, { color: theme.colors.text }]}
              >
                {article.article.abstract?.trim() || "Abstract unavailable."}
              </Text>
            </DetailSection>

            <DetailSection title="Authors">
              <View style={{ gap: theme.spacing.sm }}>
                {article.authors.length > 0 ? (
                  article.authors.map((author) => (
                    <View key={author.id} style={styles.authorRow}>
                      <Ionicons
                        color={theme.colors.primary}
                        name="person-circle-outline"
                        size={22}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          selectable
                          style={[
                            theme.typography.label,
                            { color: theme.colors.text },
                          ]}
                        >
                          {getAuthorDisplayName(author)}
                        </Text>
                        {author.orcid ? (
                          <Text
                            selectable
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textMuted },
                            ]}
                          >
                            ORCID {author.orcid}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))
                ) : (
                  <MutedText text="No authors available." />
                )}
              </View>
            </DetailSection>

            <DetailSection title="Keywords and topics">
              <TagList
                tags={getTagNames([...article.keywords, ...article.topics], 12)}
              />
            </DetailSection>

            <DetailSection title="Identifiers">
              <InfoRow label="DOI" value={article.article.doi} />
              <InfoRow label="Version" value={article.article.version} />
              <InfoRow
                label="Citations"
                value={
                  article.citedArticleIds.length > 0
                    ? String(article.citedArticleIds.length)
                    : null
                }
              />
            </DetailSection>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
          gap: theme.spacing.md,
        },
      ]}
    >
      <Text
        selectable
        style={[theme.typography.heading, { color: theme.colors.text }]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function MetaPill({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.colors.primarySoft,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={14} />
      <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
        {label}
      </Text>
    </View>
  );
}

function TagList({ tags }: { tags: string[] }) {
  const theme = useAppTheme();

  if (tags.length === 0) {
    return <MutedText text="No keywords or topics available." />;
  }

  return (
    <View style={styles.tags}>
      {tags.map((tag) => (
        <View
          key={tag}
          style={[
            styles.tag,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.pill,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <Text
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

const styles = StyleSheet.create({
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  centerState: {
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  content: {
    paddingBottom: 112,
  },
  infoRow: {
    gap: 4,
  },
  metaPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  section: {
    borderWidth: 1,
    padding: 16,
  },
  tag: {
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
