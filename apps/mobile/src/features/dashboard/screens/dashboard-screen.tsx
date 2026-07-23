import { StyleSheet, View } from "react-native";

import { ArticleErrorState } from "@/components/academic/article-error-state";
import {
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/layout/screen-shell";
import {
  OverviewCard,
  type DashboardMetric,
} from "@/features/dashboard/components/dashboard-overview";
import { CatalogSnapshot } from "@/features/dashboard/components/dashboard-catalog-snapshot";
import { PublicationGrowthContent } from "@/features/dashboard/components/dashboard-publication-growth";
import {
  RecentlyFollowedContent,
  RecentlySavedContent,
} from "@/features/dashboard/components/dashboard-recent-lists";
import { RecentPublicationsContent } from "@/features/dashboard/components/dashboard-recent-publications";
import { LoadingBlock } from "@/features/dashboard/components/dashboard-state-block";
import { TopJournalsContent } from "@/features/dashboard/components/dashboard-top-journals";
import { TrendingTopicsContent } from "@/features/dashboard/components/dashboard-topic-trends";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function DashboardScreen() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || "Scholar";
  const dashboardQuery = useDashboard();
  const dashboard = dashboardQuery.data;

  const metrics: DashboardMetric[] = [
    {
      icon: "bookmark-outline",
      label: "Saved",
      value: dashboard ? String(dashboard.bookmarkCount) : "...",
    },
    {
      icon: "radio-outline",
      label: "Following",
      value: dashboard ? String(dashboard.followCount) : "...",
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

        {dashboardQuery.isLoading ? (
          <SurfaceCard>
            <LoadingBlock label="Loading dashboard..." />
          </SurfaceCard>
        ) : null}

        {dashboardQuery.isError ? (
          <ArticleErrorState
            message={getUserFriendlyApiErrorMessage(dashboardQuery.error)}
            onRetry={() => void dashboardQuery.refetch()}
            title="Could not load dashboard"
          />
        ) : null}

        {dashboard ? (
          <>
            <View style={{ gap: theme.spacing.lg }}>
              <SectionHeading title="Catalog snapshot" />
              <CatalogSnapshot catalog={dashboard.catalog} />
            </View>

            {dashboard.publicationGrowth.length > 0 ? (
              <View style={{ gap: theme.spacing.lg }}>
                <SectionHeading title="Publication growth" />
                <PublicationGrowthContent
                  growth={dashboard.publicationGrowth}
                />
              </View>
            ) : null}

            <View style={{ gap: theme.spacing.lg }}>
              <SectionHeading title="Recently saved" />
              <RecentlySavedContent savedArticles={dashboard.recentBookmarks} />
            </View>

            <View style={{ gap: theme.spacing.lg }}>
              <SectionHeading title="Recently followed" />
              <RecentlyFollowedContent follows={dashboard.recentFollows} />
            </View>

            {dashboard.trendingTopics.length > 0 ? (
              <View style={{ gap: theme.spacing.lg }}>
                <SectionHeading title="Top topics" />
                <TrendingTopicsContent topics={dashboard.trendingTopics} />
              </View>
            ) : null}

            {dashboard.topJournals.length > 0 ? (
              <View style={{ gap: theme.spacing.lg }}>
                <SectionHeading
                  title={`Top journals ${dashboard.ranking.year} ${dashboard.ranking.metric}`}
                />
                <TopJournalsContent journals={dashboard.topJournals} />
              </View>
            ) : null}

            {dashboard.recentPublications.length > 0 ? (
              <View style={{ gap: theme.spacing.lg }}>
                <SectionHeading title="Recent publications" />
                <RecentPublicationsContent
                  publications={dashboard.recentPublications}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  dashboardContent: {
    gap: 24,
  },
});
