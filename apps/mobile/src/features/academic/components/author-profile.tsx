import { StyleSheet, Text, View } from "react-native";

import { AuthorAvatar } from "@/features/academic/components/author-card";
import {
  DetailSection,
  InfoRow,
  StatusBadge,
} from "@/features/academic/components/detail-section";
import type { AuthorListItem } from "@/features/academic/types/article.type";
import { getAuthorDisplayName } from "@/features/academic/utils/article-format";
import { FollowButton } from "@/features/follows/components/follow-button";
import { useAppTheme } from "@/theme";

export function AuthorProfile({ author }: { author: AuthorListItem }) {
  const theme = useAppTheme();
  const name = getAuthorDisplayName(author);

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
            <StatusBadge label={formatArticleCount(author.articleCount)} />
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
          <InfoRow label="ORCID" value={author.orcid} />
        </DetailSection>
      ) : null}

      <DetailSection icon="document-text-outline" title="Articles">
        <Text
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          Articles by this author will appear here.
        </Text>
      </DetailSection>
    </View>
  );
}

function formatArticleCount(count: number) {
  return `${count} article${count === 1 ? "" : "s"}`;
}

const styles = StyleSheet.create({
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
});
