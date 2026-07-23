import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DashboardTopJournal } from "@/features/dashboard/types/dashboard.type";
import {
  formatCompactCount,
  formatMetric,
} from "@/features/dashboard/utils/dashboard-format";
import { useAppTheme } from "@/theme";

export function TopJournalsContent({
  journals,
}: {
  journals: DashboardTopJournal[];
}) {
  if (journals.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {journals.slice(0, 5).map((journal, index) => (
        <JournalRow
          journal={journal}
          key={journal.scimagoSourceId}
          rank={index + 1}
        />
      ))}
    </View>
  );
}

function JournalRow({
  journal,
  rank,
}: {
  journal: DashboardTopJournal;
  rank: number;
}) {
  const theme = useAppTheme();
  const href = journal.journalId
    ? (`/journals/${encodeURIComponent(journal.journalId)}` as Href)
    : undefined;
  const meta = [
    journal.countryCode,
    journal.totalDocs === null
      ? null
      : `${formatCompactCount(journal.totalDocs)} docs`,
    journal.hIndex === null ? null : `H-index ${journal.hIndex}`,
  ].filter(Boolean);
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            rank === 1 ? theme.colors.primarySoft : theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        selectable
        style={[styles.rankMarker, { color: theme.colors.primary }]}
      >
        #{rank}
      </Text>

      <View style={styles.copy}>
        <Text
          numberOfLines={2}
          selectable
          style={[styles.name, { color: theme.colors.text }]}
        >
          {journal.title}
        </Text>

        {meta.length > 0 ? (
          <Text
            numberOfLines={1}
            selectable
            style={[styles.details, { color: theme.colors.textMuted }]}
          >
            {meta.join(" - ")}
          </Text>
        ) : null}
      </View>

      <View style={styles.scoreBlock}>
        <Text
          numberOfLines={1}
          selectable
          style={[styles.score, { color: theme.colors.teal }]}
        >
          {formatMetric(journal.sjr)}
        </Text>
        <Text
          numberOfLines={1}
          selectable
          style={[styles.scoreLabel, { color: theme.colors.textMuted }]}
        >
          SJR
        </Text>
      </View>
    </View>
  );

  if (!href) {
    return content;
  }

  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
      >
        {content}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    borderRadius: 0,
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(43, 24, 18, 0.06)",
    flexDirection: "row",
    gap: 10,
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  details: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  list: {
    gap: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  rankMarker: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 16,
    width: 28,
  },
  score: {
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "right",
  },
  scoreBlock: {
    alignItems: "flex-end",
    minWidth: 52,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 10,
  },
});
