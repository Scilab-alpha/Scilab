import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { JournalRankingListItem } from "@/features/academic/types/journal-ranking.type";
import { useAppTheme } from "@/theme";

const rankingYearOptions = [2025, 2024, 2023] as const;

export function JournalRankingsLeaderboard({
  hasNextPage,
  isFetchingNextPage,
  journals,
  onLoadMore,
  onYearChange,
  selectedYear,
}: {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  journals: JournalRankingListItem[];
  onLoadMore: () => void;
  onYearChange: (year: number) => void;
  selectedYear: number;
}) {
  const theme = useAppTheme();
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [customYear, setCustomYear] = useState("");
  const submitCustomYear = () => {
    const year = Number(customYear.trim());

    if (!customYear.trim()) {
      return;
    }

    onYearChange(year);
    setCustomYear("");
    setIsYearMenuOpen(false);
  };

  return (
    <View style={styles.leaderboard}>
      <View style={styles.leaderboardHeader}>
        <Text
          numberOfLines={1}
          selectable
          style={[
            theme.typography.heading,
            styles.leaderboardTitle,
            { color: theme.colors.text },
          ]}
        >
          Journal rankings
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsYearMenuOpen((current) => !current)}
          style={[
            styles.yearSelectButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          <View style={styles.yearSelectCopy}>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              Year
            </Text>
            <Text
              selectable
              style={[theme.typography.label, { color: theme.colors.text }]}
            >
              {selectedYear}
            </Text>
          </View>
          <Ionicons
            color={theme.colors.textMuted}
            name={isYearMenuOpen ? "chevron-up" : "chevron-down"}
            size={14}
          />
        </Pressable>
      </View>

      {isYearMenuOpen ? (
        <View
          style={[
            styles.yearMenu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          {rankingYearOptions.map((year) => {
            const isSelected = year === selectedYear;

            return (
              <Pressable
                accessibilityRole="button"
                key={year}
                onPress={() => {
                  onYearChange(year);
                  setIsYearMenuOpen(false);
                }}
                style={({ pressed }) => [
                  styles.yearMenuItem,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primarySoft
                      : pressed
                        ? theme.colors.surfaceMuted
                        : "transparent",
                    borderRadius: theme.radii.sm,
                  },
                ]}
              >
                <Text
                  selectable
                  style={[
                    theme.typography.label,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {year}
                </Text>
                {isSelected ? (
                  <Ionicons
                    color={theme.colors.primary}
                    name="checkmark"
                    size={15}
                  />
                ) : null}
              </Pressable>
            );
          })}

          <View
            style={[
              styles.yearOtherBox,
              { borderTopColor: theme.colors.outlineSoft },
            ]}
          >
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              Other
            </Text>
            <View style={styles.yearOtherRow}>
              <TextInput
                accessibilityLabel="Custom ranking year"
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={(value) =>
                  setCustomYear(value.replace(/[^0-9]/g, ""))
                }
                onSubmitEditing={submitCustomYear}
                placeholder="YYYY"
                placeholderTextColor={theme.colors.outline}
                returnKeyType="done"
                style={[
                  styles.yearOtherInput,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.outlineSoft,
                    borderRadius: theme.radii.sm,
                    color: theme.colors.text,
                  },
                ]}
                value={customYear}
              />
              <Pressable
                accessibilityLabel="Apply custom ranking year"
                accessibilityRole="button"
                onPress={submitCustomYear}
                style={({ pressed }) => [
                  styles.yearOtherApply,
                  {
                    backgroundColor: pressed
                      ? theme.colors.primaryPressed
                      : theme.colors.primary,
                    borderRadius: theme.radii.sm,
                  },
                ]}
              >
                <Ionicons
                  color={theme.colors.onPrimary}
                  name="checkmark"
                  size={14}
                />
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.rankingList}>
        {journals.map((journal, index) => (
          <JournalRankingCard
            journal={journal}
            key={journal.scimagoSourceId}
            rank={index + 1}
          />
        ))}
        {hasNextPage ? (
          <Pressable
            accessibilityRole="button"
            disabled={isFetchingNextPage}
            onPress={onLoadMore}
            style={({ pressed }) => [
              styles.rankingFooter,
              {
                backgroundColor: theme.colors.surfaceMuted,
                opacity: pressed ? 0.72 : isFetchingNextPage ? 0.68 : 1,
              },
            ]}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Text
                  style={[
                    styles.rankingFooterText,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  Load more rankings
                </Text>
                <Ionicons
                  color={theme.colors.textMuted}
                  name="chevron-down"
                  size={14}
                />
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function JournalRankingCard({
  journal,
  rank,
}: {
  journal: JournalRankingListItem;
  rank: number;
}) {
  const theme = useAppTheme();
  const rowColor = getRankingRowColor(rank, theme.isDark);
  const journalHref = journal.journalId
    ? (`/journals/${encodeURIComponent(journal.journalId)}` as Href)
    : null;
  const details = buildJournalDetails(journal);
  const content = (
    <View
      style={[
        styles.rankingCard,
        {
          backgroundColor: rowColor,
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

      <View style={styles.rankingCopy}>
        <Text
          numberOfLines={1}
          selectable
          style={[styles.rankingName, { color: theme.colors.text }]}
        >
          {journal.title}
        </Text>

        {details.length > 0 ? (
          <Text
            numberOfLines={1}
            selectable
            style={[styles.rankingDetails, { color: theme.colors.textMuted }]}
          >
            {details.join(" - ")}
          </Text>
        ) : null}
      </View>

      <View style={styles.rankingScoreBlock}>
        <Text
          numberOfLines={1}
          selectable
          style={[styles.rankingScore, { color: theme.colors.teal }]}
        >
          {formatMetric(journal.sjr)}
        </Text>
        <Text
          numberOfLines={1}
          selectable
          style={[styles.rankingScoreLabel, { color: theme.colors.textMuted }]}
        >
          SJR
        </Text>
        {journal.citationsPerDoc2Years !== null ? (
          <Text
            numberOfLines={1}
            selectable
            style={[
              styles.rankingSecondaryScore,
              { color: theme.colors.textMuted },
            ]}
          >
            {formatMetric(journal.citationsPerDoc2Years)} cites/doc
          </Text>
        ) : null}
      </View>
    </View>
  );
  const card = (
    <Pressable
      accessibilityRole={journalHref ? "link" : undefined}
      disabled={!journalHref}
      style={({ pressed }) => [
        styles.rankingPressable,
        {
          opacity: pressed ? 0.78 : journalHref ? 1 : 0.92,
        },
      ]}
    >
      {content}
    </Pressable>
  );

  if (!journalHref) {
    return card;
  }

  return (
    <Link asChild href={journalHref}>
      {card}
    </Link>
  );
}

function buildJournalDetails(journal: JournalRankingListItem) {
  const details: string[] = [];

  if (journal.type) {
    details.push(formatJournalType(journal.type));
  }

  if (journal.countryCode) {
    details.push(journal.countryCode);
  }

  if (journal.hIndex !== null) {
    details.push(`H-index ${journal.hIndex}`);
  }

  if (journal.totalDocs !== null) {
    details.push(`${formatInteger(journal.totalDocs)} docs`);
  }

  if (!journal.journalId && journal.matchStatus !== "MATCHED") {
    details.push(formatMatchStatus(journal.matchStatus));
  }

  return details;
}

function formatJournalType(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatMetric(value: number | null) {
  if (value === null) {
    return "-";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMatchStatus(status: JournalRankingListItem["matchStatus"]) {
  switch (status) {
    case "PENDING":
      return "Pending match";
    case "UNMATCHED":
      return "Unmatched";
    case "CONFLICT":
      return "Match conflict";
    case "OUT_OF_SCOPE":
      return "Out of scope";
    case "MATCHED":
      return "Matched";
  }
}

function getRankingRowColor(rank: number, isDark: boolean) {
  const lightRows = [
    "#EEDFD9",
    "#F1E6E1",
    "#F3EAE6",
    "#F5EEEA",
    "#F7F2EF",
    "#F9F5F3",
    "#FAF7F5",
    "#FBF8F7",
    "#FDFAF8",
    "#FFFCFA",
  ];
  const darkRows = [
    "#5C3A2E",
    "#53352B",
    "#4A3028",
    "#432C25",
    "#3D2923",
    "#382621",
    "#332420",
    "#2F221F",
    "#2B201E",
    "#281F1D",
  ];
  const clampedRank = Math.min(Math.max(rank, 1), 10);

  return (isDark ? darkRows : lightRows)[clampedRank - 1];
}

const styles = StyleSheet.create({
  leaderboard: {
    gap: 12,
    position: "relative",
  },
  leaderboardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leaderboardTitle: {
    flexShrink: 1,
    fontWeight: "700",
  },
  rankMarker: {
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 14,
    width: 24,
  },
  rankingCard: {
    alignItems: "flex-start",
    borderCurve: "continuous",
    borderRadius: 4,
    borderWidth: 1,
    boxShadow: "0 2px 6px rgba(43, 24, 18, 0.14)",
    flexDirection: "row",
    gap: 8,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rankingFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 48,
  },
  rankingFooterText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  rankingList: {
    gap: 12,
  },
  rankingCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  rankingName: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  rankingDetails: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  rankingPressable: {
    width: "100%",
  },
  rankingScore: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "right",
  },
  rankingScoreBlock: {
    alignItems: "flex-end",
    minWidth: 54,
  },
  rankingScoreLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 10,
  },
  rankingSecondaryScore: {
    fontSize: 8,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 11,
    marginTop: 3,
    textAlign: "right",
  },
  yearMenu: {
    borderWidth: 1,
    gap: 3,
    padding: 5,
    position: "absolute",
    right: 0,
    top: 48,
    width: 148,
    zIndex: 10,
  },
  yearMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 34,
    paddingHorizontal: 9,
  },
  yearOtherApply: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  yearOtherBox: {
    borderTopWidth: 1,
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  yearOtherInput: {
    borderWidth: 1,
    flex: 1,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    height: 28,
    lineHeight: 15,
    minWidth: 0,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  yearOtherRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  yearSelectButton: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 42,
    paddingHorizontal: 7,
    width: 108,
  },
  yearSelectCopy: {
    flex: 1,
    gap: 1,
  },
});
