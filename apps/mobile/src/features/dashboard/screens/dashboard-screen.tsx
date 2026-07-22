import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useArticles } from "@/features/articles/hooks/use-articles";
import { useBookmarks } from "@/features/bookmarks/hooks/use-bookmarks";
import {
  OverviewCard,
  type DashboardMetric,
} from "@/features/dashboard/components/dashboard-overview";
import {
  LatestPapersContent,
  RecentlySavedContent,
} from "@/features/dashboard/components/dashboard-paper-sections";
import { ScreenShell, SectionHeading } from "@/components/layout/screen-shell";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function DashboardScreen() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || "Scholar";
  const bookmarksQuery = useBookmarks();
  const latestArticlesQuery = useArticles({ sort: "newest" });

  const savedArticles = useMemo(
    () => bookmarksQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bookmarksQuery.data],
  );
  const latestArticles = useMemo(
    () =>
      latestArticlesQuery.data?.pages
        .flatMap((page) => page.items)
        .slice(0, 3) ?? [],
    [latestArticlesQuery.data],
  );
  const metrics: DashboardMetric[] = [
    {
      icon: "bookmark-outline",
      label: "Saved",
      value: bookmarksQuery.isLoading ? "..." : String(savedArticles.length),
    },
    {
      icon: "radio-outline",
      label: "Following",
      value: "--",
    },
  ];

  return (
    <ScreenShell
      showSubtitle={false}
      subtitle=""
      title={`Welcome back, ${firstName}`}
    >
      <View style={styles.dashboardContent}>
        <OverviewCard metrics={metrics} />

        <View style={{ gap: theme.spacing.lg }}>
          <SectionHeading title="Recently saved" />
          <RecentlySavedContent
            isError={bookmarksQuery.isError}
            isLoading={bookmarksQuery.isLoading}
            savedArticles={savedArticles.slice(0, 2)}
          />
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          <SectionHeading title="Latest papers" />
          <LatestPapersContent
            articles={latestArticles}
            isError={latestArticlesQuery.isError}
            isLoading={latestArticlesQuery.isLoading}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  dashboardContent: {
    gap: 24,
  },
});
