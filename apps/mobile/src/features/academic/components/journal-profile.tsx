import { StyleSheet, Text, View } from "react-native";

import {
  DetailSection,
  StatusBadge,
} from "@/features/academic/components/detail-section";
import type { JournalListItem } from "@/features/academic/types/article.type";
import { FollowButton } from "@/features/follows/components/follow-button";
import { useAppTheme } from "@/theme";

export function JournalProfile({ journal }: { journal: JournalListItem }) {
  const theme = useAppTheme();
  const name = getJournalName(journal);

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={[styles.hero, { gap: theme.spacing.lg }]}>
        <View style={styles.titleRow}>
          <Text
            selectable
            style={[
              theme.typography.display,
              styles.titleText,
              { color: theme.colors.text },
            ]}
          >
            {name}
          </Text>
        </View>
        <View style={styles.heroText}>
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            {formatJournalSubtitle(journal)}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <StatusBadge label={formatArticleCount(journal.articleCount)} />
          {journal.isOpenAccess ? (
            <StatusBadge label="Open access" tone="success" />
          ) : null}
          {journal.isOaDiamond ? (
            <StatusBadge label="Diamond OA" tone="primary" />
          ) : null}
        </View>
        <FollowButton
          label="Follow journal"
          objectId={journal.id}
          objectType="JOURNAL"
        />
      </View>

      <DetailSection icon="information-circle-outline" title="Journal info">
        <JournalInfoList
          rows={[
            { label: "Publisher", value: journal.publisherName },
            { label: "ISSN", value: journal.issnList?.join(", ") },
            { label: "Type", value: journal.type },
            { label: "Country", value: journal.country },
            { label: "Region", value: journal.region },
            { label: "Coverage", value: journal.coverage },
          ]}
        />
      </DetailSection>

      {journal.subjectCategories?.length ? (
        <DetailSection icon="albums-outline" title="Subject categories">
          <View style={styles.tags}>
            {journal.subjectCategories.map((category) => (
              <View
                key={category}
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
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {category}
                </Text>
              </View>
            ))}
          </View>
        </DetailSection>
      ) : null}
    </View>
  );
}

function JournalInfoList({
  rows,
}: {
  rows: { label: string; value?: string | null }[];
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoList}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.infoItem,
            {
              borderBottomColor: theme.colors.outlineSoft,
              borderBottomWidth: index === rows.length - 1 ? 0 : 1,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            selectable
            style={[
              theme.typography.caption,
              styles.infoLabel,
              { color: theme.colors.textMuted },
            ]}
          >
            {row.label}
          </Text>
          <Text
            selectable
            style={[
              theme.typography.body,
              styles.infoValue,
              { color: theme.colors.text },
            ]}
          >
            {row.value?.trim() || "Unavailable"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getJournalName(journal: JournalListItem) {
  return journal.displayName?.trim() || "Untitled journal";
}

function formatArticleCount(count: number) {
  return `${count} article${count === 1 ? "" : "s"}`;
}

function formatJournalSubtitle(journal: JournalListItem) {
  const parts = [journal.publisherName, journal.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.join(" | ") || "Academic journal";
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hero: {
    alignItems: "stretch",
    paddingTop: 4,
  },
  heroText: {
    gap: 8,
  },
  infoItem: {
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 11,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  infoList: {
    paddingVertical: 2,
  },
  infoValue: {
    lineHeight: 20,
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
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  titleText: {
    flex: 1,
    lineHeight: 30,
  },
});
