import { describe, expect, it } from "vitest";
import type { CatalogSnapshot } from "../api/fetch-catalog-snapshot";
import { buildAdvancedDashboardInsights } from "./build-advanced-dashboard-insights";
import { buildDashboardInsights } from "./build-dashboard-insights";
import { buildTrendInsights } from "@/features/reports/lib/build-trend-insights";

describe("backend snapshot analytics", () => {
  it("keeps calculated output scoped and does not invent ranking or journal trend", () => {
    const advanced = buildAdvancedDashboardInsights(snapshot);
    const dashboard = buildDashboardInsights(snapshot);

    expect(advanced.coverageHint).toContain("2 backend catalog articles");
    expect(advanced).not.toHaveProperty("rankingProgress");
    expect(dashboard.catalogJournals[0]).toEqual({
      id: "journal-1",
      name: "Backend Journal",
      articles: 2,
    });
  });

  it("does not label zero-growth topics as emerging", () => {
    const trends = buildTrendInsights(snapshot);
    expect(trends.growthComparison[0]?.growth).toBe(0);
    expect(trends.emergingTopics).toEqual([]);
  });
});

const snapshotJournal = {
  id: "journal-1",
  sourceId: "source-1",
  displayName: "Backend Journal",
  type: "journal",
  isOpenAccess: true,
  isOaDiamond: false,
  coverage: null,
  country: "US",
  issnList: ["1234-5678"],
  publisherName: "Publisher",
  publisherImageUrl: null,
  subjectCategories: ["Computer Science"],
};

const snapshot: CatalogSnapshot = {
  articles: [article("article-1", 2024), article("article-2", 2025)],
  journals: [
    {
      id: "journal-1",
      sourceId: "source-1",
      displayName: "Backend Journal",
      type: "journal",
      isOpenAccess: true,
      isOaDiamond: false,
      coverage: null,
      country: "US",
      issnList: ["1234-5678"],
      publisherName: "Publisher",
      publisherImageUrl: null,
      subjectCategories: ["Computer Science"],
      articleCount: 2,
    },
  ],
  articlesHasMore: false,
  journalsHasMore: false,
};

function article(id: string, publicationYear: number) {
  return {
    article: {
      id,
      title: id,
      abstract: null,
      doi: null,
      publicationYear,
      version: null,
      volumeNumber: null,
      issueNumber: null,
      citationCount: 0,
      createdAt: null,
      updatedAt: null,
    },
    journal: snapshotJournal,
    authors: [],
    keywords: [],
    topics: [
      {
        id: "topic-1",
        displayName: "Backend Topic",
        score: 1,
        isPrimary: true,
      },
    ],
    citedArticleIds: [],
  };
}
