import type { ArticleGraph } from "@/features/experiments/types/article.types";
import type { JournalListItem } from "@/features/experiments/types/journal.types";
import {
  getArticleJournal,
  getArticleTitle,
} from "@/features/experiments/utils/article-format";
import type { CatalogSnapshot } from "@/features/dashboard/api/fetch-catalog-snapshot";

export type DashboardStat = {
  label: string;
  value: number;
  hint: string;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
};

export type DashboardTopicTrend = {
  topic: string;
  count: number;
  change: number;
  trend: "up" | "down" | "flat";
};

export type DashboardJournalRow = {
  id: string;
  name: string;
  articles: number;
};

export type DashboardPublicationRow = {
  id: string;
  title: string;
  journal: string;
  year: number | null;
  outgoingReferences: number;
};

export type DashboardInsights = {
  stats: DashboardStat[];
  publicationGrowth: Array<{ year: string; publications: number }>;
  yearDistribution: Array<{ year: string; articles: number }>;
  topicFrequencyChanges: DashboardTopicTrend[];
  catalogJournals: DashboardJournalRow[];
  recentPublications: DashboardPublicationRow[];
  snapshotSize: {
    articles: number;
    journals: number;
    articlesHasMore: boolean;
    journalsHasMore: boolean;
  };
};

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function countByYear(articles: ArticleGraph[]) {
  const map = new Map<number, number>();
  for (const item of articles) {
    const year = item.article.publicationYear;
    if (typeof year !== "number") continue;
    map.set(year, (map.get(year) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function countTopics(articles: ArticleGraph[]) {
  const map = new Map<string, number>();
  for (const item of articles) {
    for (const topic of item.topics) {
      const name = topic.displayName?.trim();
      if (!name) continue;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    for (const keyword of item.keywords) {
      const name = keyword.displayName?.trim();
      if (!name) continue;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function uniqueSubjects(journals: JournalListItem[]) {
  const set = new Set<string>();
  for (const journal of journals) {
    for (const subject of journal.subjectCategories ?? []) {
      const name = subject.trim();
      if (name) set.add(name);
    }
  }
  return set.size;
}

export function buildDashboardInsights(
  snapshot: CatalogSnapshot,
): DashboardInsights {
  const { articles, journals, articlesHasMore, journalsHasMore } = snapshot;
  const byYear = countByYear(articles);
  const topicCounts = countTopics(articles);
  const keywordCount = new Set(
    articles.flatMap((item) =>
      item.keywords
        .map((keyword) => keyword.displayName?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).size;
  const topicCount = new Set(
    articles.flatMap((item) =>
      item.topics
        .map((topic) => topic.displayName?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).size;

  const recentYears = byYear.slice(-2);
  const currentYearCount = recentYears.at(-1)?.[1] ?? 0;
  const previousYearCount = recentYears.at(-2)?.[1] ?? 0;
  const articleYoY = percentChange(currentYearCount, previousYearCount);

  const publicationGrowth = byYear.map(([year, publications]) => ({
    year: String(year),
    publications,
  }));

  const yearDistribution = byYear.map(([year, count]) => ({
    year: String(year),
    articles: count,
  }));

  const mid = Math.max(1, Math.floor(byYear.length / 2));
  const olderYears = new Set(byYear.slice(0, mid).map(([year]) => year));
  const newerYears = new Set(byYear.slice(mid).map(([year]) => year));

  const topicByEra = new Map<string, { old: number; neu: number }>();
  for (const item of articles) {
    const year = item.article.publicationYear;
    if (typeof year !== "number") continue;
    const era = newerYears.has(year)
      ? "neu"
      : olderYears.has(year)
        ? "old"
        : null;
    if (!era) continue;
    const labels = [
      ...item.topics.map((topic) => topic.displayName?.trim()),
      ...item.keywords.map((keyword) => keyword.displayName?.trim()),
    ].filter((name): name is string => Boolean(name));
    for (const label of labels) {
      const row = topicByEra.get(label) ?? { old: 0, neu: 0 };
      row[era] += 1;
      topicByEra.set(label, row);
    }
  }

  const topicFrequencyChanges: DashboardTopicTrend[] = topicCounts
    .slice(0, 5)
    .map(([topic, count]) => {
      const eras = topicByEra.get(topic) ?? { old: 0, neu: 0 };
      const change = percentChange(eras.neu, eras.old);
      return {
        topic,
        count,
        change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
      };
    });

  const catalogJournals: DashboardJournalRow[] = [...journals]
    .sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
    .slice(0, 5)
    .map((journal) => ({
      id: journal.id,
      name: journal.displayName?.trim() || journal.id,
      articles: journal.articleCount ?? 0,
    }));

  const recentPublications: DashboardPublicationRow[] = [...articles]
    .sort((a, b) => {
      const yearA = a.article.publicationYear ?? 0;
      const yearB = b.article.publicationYear ?? 0;
      if (yearB !== yearA) return yearB - yearA;
      return (
        (b.citedArticleIds?.length ?? 0) - (a.citedArticleIds?.length ?? 0)
      );
    })
    .slice(0, 5)
    .map((item) => ({
      id: item.article.id,
      title: getArticleTitle(item),
      journal: getArticleJournal(item),
      year: item.article.publicationYear,
      outgoingReferences: item.citedArticleIds?.length ?? 0,
    }));

  const stats: DashboardStat[] = [
    {
      label: "Journals retrieved",
      value: journals.length,
      hint: journalsHasMore ? "More available in catalog" : "Catalog page",
      changePercent: null,
      direction: "flat",
    },
    {
      label: "Articles retrieved",
      value: articles.length,
      hint: articlesHasMore
        ? "More records are available from the backend"
        : "All records in this backend snapshot are loaded",
      changePercent: articleYoY,
      direction: articleYoY > 0 ? "up" : articleYoY < 0 ? "down" : "flat",
    },
    {
      label: "Unique keywords",
      value: keywordCount,
      hint: "From backend snapshot articles",
      changePercent: null,
      direction: "flat",
    },
    {
      label: "Topics & subjects",
      value: topicCount + uniqueSubjects(journals),
      hint: "Topics + journal subjects",
      changePercent: null,
      direction: "flat",
    },
  ];

  return {
    stats,
    publicationGrowth,
    yearDistribution,
    topicFrequencyChanges,
    catalogJournals,
    recentPublications,
    snapshotSize: {
      articles: articles.length,
      journals: journals.length,
      articlesHasMore,
      journalsHasMore,
    },
  };
}
