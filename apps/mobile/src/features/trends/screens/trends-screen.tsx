import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ArticleErrorState } from "@/components/academic/article-error-state";
import { JournalRankingsLeaderboard } from "@/features/trends/components/journal-rankings-leaderboard";
import { useJournalRankings } from "@/features/trends/hooks/use-journal-rankings";
import { ScreenShell, SurfaceCard } from "@/components/layout/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

const defaultRankingYear = 2025;

export function TrendsScreen() {
  const theme = useAppTheme();
  const [rankingYear, setRankingYear] = useState(defaultRankingYear);
  const journalRankingsQuery = useJournalRankings(rankingYear);
  const journalRankings =
    journalRankingsQuery.data?.pages.flatMap((page) => page.items) ?? [];
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
      hideHeader
      subtitle="Compare publication momentum across topics and time."
      title="Publication trends"
    >
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
