import { apiRequest } from "@/services/api";

import type { BookmarkArticlePayload } from "@/features/bookmarks/types/bookmark.type";
import type { DashboardData } from "@/features/dashboard/types/dashboard.type";

type DashboardApiData = Omit<DashboardData, "recentBookmarks"> & {
  recentBookmarks: (Omit<
    DashboardData["recentBookmarks"][number],
    "article"
  > & {
    article: BookmarkArticlePayload;
  })[];
};

export async function getDashboard(): Promise<DashboardData> {
  const result = await apiRequest<DashboardApiData>({
    authenticated: true,
    method: "GET",
    path: "/dashboard/me",
  });

  return {
    ...result,
    recentBookmarks: result.recentBookmarks.map((bookmark) => ({
      ...bookmark,
      article: toArticleGraph(bookmark.article),
    })),
  };
}

function toArticleGraph(article: BookmarkArticlePayload) {
  const {
    authors = [],
    citedArticleIds = [],
    journal = null,
    keywords = [],
    topics = [],
    ...articleNode
  } = article;

  return {
    article: articleNode,
    authors: authors ?? [],
    citedArticleIds: citedArticleIds ?? [],
    journal,
    keywords: keywords ?? [],
    topics: topics ?? [],
  };
}
