import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { JournalRankingsLeaderboard } from "@/features/academic/components/journal-rankings-leaderboard";
import { useJournalRankings } from "@/features/academic/hooks/use-journal-rankings";
import {
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

const defaultRankingYear = 2025;

export function TrendsScreen() {
  const theme = useAppTheme();
  const [rankingYear, setRankingYear] = useState(defaultRankingYear);
  const journalRankingsQuery = useJournalRankings(rankingYear);
  const journalRankings =
    journalRankingsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const topics = [
    ["Large language models", "+24%"],
    ["Explainable AI", "+15%"],
    ["Edge intelligence", "+11%"],
  ];
  const applyRankingYear = (nextYear: number) => {
    const maximumYear = new Date().getFullYear() + 1;

    if (
      Number.isInteger(nextYear) &&
      nextYear >= 1000 &&
      nextYear <= maximumYear
    ) {
      setRankingYear(nextYear);
    }
  };

  return (
    <ScreenShell
      subtitle="Compare publication momentum across topics and time."
      title="Publication trends"
    >
      <SurfaceCard>
        <Text
          selectable
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          TREND SNAPSHOT | 2021-2026
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            height: 130,
            alignItems: "flex-end",
          }}
        >
          {[28, 38, 46, 59, 73, 92].map((height, index) => (
            <View
              key={height}
              style={{ alignItems: "center", flex: 1, gap: 6 }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 4,
                  height: `${height}%`,
                  opacity: 0.82,
                  width: "72%",
                }}
              />
              <Text
                selectable
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted },
                ]}
              >
                {21 + index}
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeading title="Fast-growing topics" />
        <SurfaceCard>
          {topics.map(([topic, growth], index) => (
            <View
              key={topic}
              style={{
                alignItems: "center",
                borderBottomColor: theme.colors.outlineSoft,
                borderBottomWidth: index === topics.length - 1 ? 0 : 1,
                flexDirection: "row",
                paddingVertical: 7,
              }}
            >
              <Text
                selectable
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, flex: 1 },
                ]}
              >
                {topic}
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.label,
                  { color: theme.colors.success },
                ]}
              >
                {growth}
              </Text>
            </View>
          ))}
        </SurfaceCard>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        {journalRankingsQuery.isError ? (
          <ArticleErrorState
            message={getUserFriendlyApiErrorMessage(journalRankingsQuery.error)}
            onRetry={() => void journalRankingsQuery.refetch()}
            title="Could not load journal rankings"
          />
        ) : journalRankingsQuery.isLoading ? (
          <SurfaceCard>
            <View style={styles.loadingState}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          </SurfaceCard>
        ) : (
          <JournalRankingsLeaderboard
            hasNextPage={journalRankingsQuery.hasNextPage}
            isFetchingNextPage={journalRankingsQuery.isFetchingNextPage}
            journals={journalRankings}
            onLoadMore={() => void journalRankingsQuery.fetchNextPage()}
            onYearChange={applyRankingYear}
            selectedYear={rankingYear}
          />
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
  },
});
