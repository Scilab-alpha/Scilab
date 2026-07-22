import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import {
  DetailSection,
  StatusBadge,
} from "@/components/academic/detail-section";
import type { JournalListItem } from "@/types/academic.type";
import { FollowButton } from "@/features/follows/components/follow-button";
import { useAppTheme } from "@/theme";

export function JournalProfile({ journal }: { journal: JournalListItem }) {
  const theme = useAppTheme();
  const name = getJournalName(journal);

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={[styles.hero, { gap: theme.spacing.lg }]}>
        <View style={styles.titleRow}>
          {journal.publisherImageUrl ? (
            <Image
              contentFit="contain"
              source={{ uri: journal.publisherImageUrl }}
              style={[
                styles.publisherLogo,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineSoft,
                },
              ]}
            />
          ) : null}
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
        <View style={styles.publisherRow}>
          <Text
            selectable
            style={[
              theme.typography.body,
              styles.publisherText,
              { color: theme.colors.textMuted },
            ]}
          >
            {formatJournalSubtitle(journal)}
          </Text>
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
            {
              href: getSourceWebUrl(journal.sourceId),
              label: "Source ID",
              value: journal.sourceId,
            },
            { label: "Publisher", value: journal.publisherName },
            { label: "ISSN", value: journal.issnList?.join(", ") },
            { label: "Type", value: journal.type },
            { label: "Country", value: journal.country },
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
  rows: { href?: string | null; label: string; value?: string | null }[];
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
          {row.href && row.value?.trim() ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(row.href!)}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : null)}
            >
              <Text
                selectable
                style={[
                  theme.typography.body,
                  styles.infoValue,
                  styles.infoLink,
                  { color: theme.colors.primary },
                ]}
              >
                {row.value.trim()}
              </Text>
            </Pressable>
          ) : (
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
          )}
        </View>
      ))}
    </View>
  );
}

function getSourceWebUrl(sourceId?: string | null) {
  const value = sourceId?.trim();

  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://openalex.org/${encodeURIComponent(value)}`;
}

function getJournalName(journal: JournalListItem) {
  return journal.displayName?.trim() || "Untitled journal";
}

function formatJournalSubtitle(journal: JournalListItem) {
  const parts = [journal.publisherName, journal.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.join(" | ") || "Academic journal";
}

const styles = StyleSheet.create({
  publisherRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hero: {
    alignItems: "stretch",
    paddingTop: 4,
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
  infoLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  infoList: {
    paddingVertical: 2,
  },
  infoValue: {
    lineHeight: 20,
  },
  publisherLogo: {
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  publisherText: {
    flexShrink: 1,
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
