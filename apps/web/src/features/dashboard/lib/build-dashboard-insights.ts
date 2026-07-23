import type { ArticleGraph } from "@/features/experiments/types/article.types";
import type { JournalListItem } from "@/features/experiments/types/journal.types";
import {
  getArticleJournal,
  getArticleTitle,
} from "@/features/experiments/utils/article-format";
import type { CatalogSample } from "@/features/dashboard/api/fetch-catalog-sample";
import {
  CATALOG_INSIGHT_YEARS,
  filterArticlesToInsightYears,
} from "@/features/dashboard/api/fetch-catalog-sample";
import catalogTotals from "@/features/dashboard/data/catalog-totals.json";

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
  trend: "up" | "down";
};

export type DashboardJournalRow = {
  id: string;
  name: string;
  articles: number;
  lastUpdate: string;
  trend: string;
};

export type DashboardPublicationRow = {
  id: string;
  title: string;
  journal: string;
  year: number | null;
  citations: number;
};

export type DashboardInsights = {
  stats: DashboardStat[];
  publicationGrowth: Array<{ year: string; publications: number }>;
  yearDistribution: Array<{ year: string; articles: number }>;
  trendingTopics: DashboardTopicTrend[];
  recentJournals: DashboardJournalRow[];
  recentPublications: DashboardPublicationRow[];
  sampleSize: {
    articles: number;
    journals: number;
    articlesHasMore: boolean;
    journalsHasMore: boolean;
  };
};

const TREND_COLORS_UNUSED = 0; // keep file focused

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function countByYear(articles: ArticleGraph[]) {
  const map = new Map<number, number>();
  for (const year of CATALOG_INSIGHT_YEARS) {
    map.set(year, 0);
  }
  for (const item of articles) {
    const year = item.article.publicationYear;
    if (typeof year !== "number" || !map.has(year)) continue;
    map.set(year, (map.get(year) ?? 0) + 1);
  }
  return CATALOG_INSIGHT_YEARS.map((year) => [year, map.get(year) ?? 0] as const);
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

function formatRelativeFromIso(value: string | null) {
  if (!value) return "Recently indexed";
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return "Recently indexed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function buildDashboardInsights(
  sample: CatalogSample,
): DashboardInsights {
  void TREND_COLORS_UNUSED;
  const articles = filterArticlesToInsightYears(sample.articles);
  const { journals, articlesHasMore, journalsHasMore } = sample;
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

  const journalArticleTotal = journals.reduce(
    (sum, journal) => sum + (journal.articleCount ?? 0),
    0,
  );
  const avgArticles =
    journals.length > 0 ? Math.round(journalArticleTotal / journals.length) : 0;

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

  const trendingTopics: DashboardTopicTrend[] = topicCounts
    .slice(0, 5)
    .map(([topic, count]) => {
      const eras = topicByEra.get(topic) ?? { old: 0, neu: 0 };
      const change = percentChange(eras.neu, eras.old);
      return {
        topic,
        count,
        change,
        trend: change >= 0 ? "up" : "down",
      };
    });

  const recentJournals: DashboardJournalRow[] = [...journals]
    .sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
    .slice(0, 5)
    .map((journal) => ({
      id: journal.id,
      name: journal.displayName?.trim() || journal.id,
      articles: journal.articleCount ?? 0,
      lastUpdate: "In catalog",
      trend:
        (journal.articleCount ?? 0) >= avgArticles
          ? `+${Math.max(1, Math.round(((journal.articleCount ?? 0) / Math.max(avgArticles, 1)) * 10))}%`
          : "—",
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
      citations: item.citedArticleIds?.length ?? 0,
    }));

  void formatRelativeFromIso;

  const stats: DashboardStat[] = [
    {
      label: "Journals in catalog",
      value: catalogTotals.journals,
      hint: `Catalog total (${catalogTotals.generatedAt})`,
      changePercent: null,
      direction: "flat",
    },
    {
      label: "Articles in catalog",
      value: catalogTotals.articles,
      hint: `Catalog total (${catalogTotals.generatedAt})`,
      changePercent: articleYoY,
      direction: articleYoY > 0 ? "up" : articleYoY < 0 ? "down" : "flat",
    },
    {
      label: "Unique keywords",
      value: keywordCount,
      hint: "From sampled articles",
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
    trendingTopics,
    recentJournals,
    recentPublications,
    sampleSize: {
      articles: articles.length,
      journals: journals.length,
      articlesHasMore,
      journalsHasMore,
    },
  };
}
