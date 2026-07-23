import type { ArticleGraph } from "@/types/academic.type";
import type { FollowListItem } from "@/features/follows/types/follow.type";

export type DashboardBookmark = {
  article: ArticleGraph;
  articleId: string;
  bookmarkedAt: string;
};

export type DashboardCatalog = {
  articleCount: number;
  asOf: string | null;
  journalCount: number;
  topicsAndSubjectsCount: number;
  uniqueKeywordCount: number;
};

export type DashboardYearPoint = {
  articles: number;
  year: number;
};

export type DashboardTrendingTopic = {
  changePercent: number;
  count: number;
  name: string;
};

export type DashboardTopJournal = {
  countryCode: string | null;
  hIndex: number | null;
  journalId: string | null;
  scimagoSourceId: string;
  sjr: number | null;
  title: string;
  totalDocs: number | null;
};

export type DashboardRecentPublication = {
  citationCount: number;
  id: string;
  journal: string | null;
  publicationYear: number | null;
  title: string | null;
};

export type DashboardData = {
  bookmarkCount: number;
  catalog: DashboardCatalog;
  followCount: number;
  publicationGrowth: DashboardYearPoint[];
  ranking: {
    metric: "SJR";
    year: number;
  };
  recentBookmarks: DashboardBookmark[];
  recentFollows: FollowListItem[];
  recentPublications: DashboardRecentPublication[];
  topJournals: DashboardTopJournal[];
  trendingTopics: DashboardTrendingTopic[];
  yearDistribution: DashboardYearPoint[];
};
