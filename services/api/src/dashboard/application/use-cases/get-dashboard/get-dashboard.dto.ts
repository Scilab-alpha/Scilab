import { ArticleGraphOutput, FollowTargetOutput } from '@repo/academic/domain';
import {
  FollowNotifyMode,
  FollowObjectType,
} from '@/follow/application/ports/follow.ports';

export interface GetDashboardInput {
  userId: string;
}

export interface DashboardBookmarkOutput {
  articleId: string;
  bookmarkedAt: Date;
  article: ArticleGraphOutput;
}

export interface DashboardFollowOutput {
  followId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: FollowNotifyMode;
  followedAt: Date;
  target: FollowTargetOutput;
}

export interface GetDashboardOutput {
  bookmarkCount: number;
  followCount: number;
  recentBookmarks: DashboardBookmarkOutput[];
  recentFollows: DashboardFollowOutput[];
  ranking: {
    year: number;
    metric: 'SJR';
  };
  catalog: {
    journalCount: number;
    articleCount: number;
    uniqueKeywordCount: number;
    topicsAndSubjectsCount: number;
    asOf: string | null;
  };
  publicationGrowth: Array<{ year: number; articles: number }>;
  yearDistribution: Array<{ year: number; articles: number }>;
  trendingTopics: Array<{
    name: string;
    count: number;
    changePercent: number;
  }>;
  topJournals: Array<{
    scimagoSourceId: string;
    journalId: string | null;
    title: string;
    sjr: number | null;
    hIndex: number | null;
    totalDocs: number | null;
    countryCode: string | null;
  }>;
  recentPublications: Array<{
    id: string;
    title: string | null;
    journal: string | null;
    publicationYear: number | null;
    citationCount: number;
  }>;
}
