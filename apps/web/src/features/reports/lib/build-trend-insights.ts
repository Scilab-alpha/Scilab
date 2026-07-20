import type { ArticleGraph } from "@/features/experiments/types/article.types";
import type { CatalogSample } from "@/features/dashboard/api/fetch-catalog-sample";

export const TREND_SERIES_COLORS = [
  "#D3AB9E",
  "#3AC9C1",
  "#8AAFA8",
  "#C4B5A8",
  "#5C534E",
  "#9B8B7E",
] as const;

export type TrendKeywordSeries = {
  id: string;
  label: string;
  dataKey: string;
  color: string;
};

export type TrendGrowthRow = {
  keyword: string;
  current: number;
  previous: number;
  growth: number;
  color: string;
};

export type EmergingTopicRow = {
  id: string;
  topic: string;
  objectType: "TOPIC" | "KEYWORD";
  publications: number;
  growth: number;
  momentum: "explosive" | "strong" | "growing";
};

export type TopJournalShare = {
  id: string;
  name: string;
  publications: number;
  share: number;
  trend: "up" | "down" | "stable";
};

export type TrendInsights = {
  metrics: {
    totalPublications: number;
    yearlyAverage: number;
    emergingCount: number;
    topKeyword: { label: string; count: number } | null;
    sampleHint: string;
  };
  keywords: TrendKeywordSeries[];
  multiTrend: Array<Record<string, string | number>>;
  growthComparison: TrendGrowthRow[];
  velocityByYear: Array<{ year: string; velocity: number; avg: number }>;
  emergingTopics: EmergingTopicRow[];
  topJournals: TopJournalShare[];
  journalOptions: Array<{ id: string; name: string }>;
  subjectOptions: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function labelOf(item: ArticleGraph) {
  const topics = item.topics
    .map((topic) => ({
      id: topic.id,
      name: topic.displayName?.trim(),
      type: "TOPIC" as const,
    }))
    .filter((row): row is { id: string; name: string; type: "TOPIC" } =>
      Boolean(row.name),
    );
  const keywords = item.keywords
    .map((keyword) => ({
      id: keyword.id,
      name: keyword.displayName?.trim(),
      type: "KEYWORD" as const,
    }))
    .filter((row): row is { id: string; name: string; type: "KEYWORD" } =>
      Boolean(row.name),
    );
  return [...topics, ...keywords];
}

export function buildTrendInsights(
  sample: CatalogSample,
  filters?: {
    journalId?: string;
    subject?: string;
    yearWindow?: number | "all";
  },
): TrendInsights {
  let articles = sample.articles;

  if (filters?.journalId) {
    articles = articles.filter(
      (item) => item.journal?.id === filters.journalId,
    );
  }

  if (filters?.subject) {
    const subject = filters.subject.toLowerCase();
    articles = articles.filter((item) =>
      (item.journal?.subjectCategories ?? []).some((entry) =>
        entry.toLowerCase().includes(subject),
      ),
    );
  }

  const years = [
    ...new Set(
      articles
        .map((item) => item.article.publicationYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ].sort((a, b) => a - b);

  let activeYears = years;
  if (filters?.yearWindow && filters.yearWindow !== "all") {
    const minYear = Math.max(...years, 0) - (filters.yearWindow - 1);
    activeYears = years.filter((year) => year >= minYear);
    articles = articles.filter((item) => {
      const year = item.article.publicationYear;
      return typeof year === "number" && year >= minYear;
    });
  }

  const tagTotals = new Map<
    string,
    { id: string; name: string; type: "TOPIC" | "KEYWORD"; count: number }
  >();
  const tagByYear = new Map<string, Map<number, number>>();

  for (const item of articles) {
    const year = item.article.publicationYear;
    for (const tag of labelOf(item)) {
      const key = `${tag.type}:${tag.id}`;
      const total = tagTotals.get(key) ?? {
        id: tag.id,
        name: tag.name,
        type: tag.type,
        count: 0,
      };
      total.count += 1;
      tagTotals.set(key, total);

      if (typeof year === "number") {
        const yearMap = tagByYear.get(key) ?? new Map<number, number>();
        yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
        tagByYear.set(key, yearMap);
      }
    }
  }

  const rankedTags = [...tagTotals.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );
  const topTags = rankedTags.slice(0, 5);

  const keywords: TrendKeywordSeries[] = topTags.map(([key, tag], index) => ({
    id: key,
    label: tag.name,
    dataKey: slugify(tag.name) || `series_${index}`,
    color: TREND_SERIES_COLORS[index % TREND_SERIES_COLORS.length],
  }));

  const multiTrend = activeYears.map((year) => {
    const row: Record<string, string | number> = { year: String(year) };
    for (const keyword of keywords) {
      const yearMap = tagByYear.get(keyword.id);
      row[keyword.dataKey] = yearMap?.get(year) ?? 0;
    }
    return row;
  });

  const mid = Math.max(1, Math.floor(activeYears.length / 2));
  const older = new Set(activeYears.slice(0, mid));
  const newer = new Set(activeYears.slice(mid));

  const growthComparison: TrendGrowthRow[] = keywords.map((keyword) => {
    const yearMap = tagByYear.get(keyword.id) ?? new Map();
    let previous = 0;
    let current = 0;
    for (const [year, count] of yearMap) {
      if (older.has(year)) previous += count;
      if (newer.has(year)) current += count;
    }
    return {
      keyword: keyword.label,
      current,
      previous,
      growth: percentChange(current, previous),
      color: keyword.color,
    };
  });

  const yearlyCounts = activeYears.map((year) => {
    const count = articles.filter(
      (item) => item.article.publicationYear === year,
    ).length;
    return { year, count };
  });
  const avg =
    yearlyCounts.length > 0
      ? Math.round(
          yearlyCounts.reduce((sum, row) => sum + row.count, 0) /
            yearlyCounts.length,
        )
      : 0;

  const velocityByYear = yearlyCounts.map((row) => ({
    year: String(row.year),
    velocity: row.count,
    avg,
  }));

  const emergingTopics: EmergingTopicRow[] = rankedTags
    .slice(0, 8)
    .map(([, tag]) => {
      const key = `${tag.type}:${tag.id}`;
      const yearMap = tagByYear.get(key) ?? new Map();
      let previous = 0;
      let current = 0;
      for (const [year, count] of yearMap) {
        if (older.has(year)) previous += count;
        if (newer.has(year)) current += count;
      }
      const growth = percentChange(current, previous);
      const momentum: EmergingTopicRow["momentum"] =
        growth >= 100 ? "explosive" : growth >= 40 ? "strong" : "growing";
      return {
        id: tag.id,
        topic: tag.name,
        objectType: tag.type,
        publications: tag.count,
        growth,
        momentum,
      };
    })
    .sort((a, b) => b.growth - a.growth);

  const journalCounts = new Map<
    string,
    { id: string; name: string; count: number }
  >();
  for (const item of articles) {
    if (!item.journal?.id) continue;
    const name = item.journal.displayName?.trim() || item.journal.id;
    const row = journalCounts.get(item.journal.id) ?? {
      id: item.journal.id,
      name,
      count: 0,
    };
    row.count += 1;
    journalCounts.set(item.journal.id, row);
  }

  const journalRows = [...journalCounts.values()].sort(
    (a, b) => b.count - a.count,
  );
  const journalTotal =
    journalRows.reduce((sum, row) => sum + row.count, 0) || 1;

  const topJournals: TopJournalShare[] = journalRows.slice(0, 5).map((row) => ({
    id: row.id,
    name: row.name,
    publications: row.count,
    share: Math.round((row.count / journalTotal) * 1000) / 10,
    trend: "stable",
  }));

  const subjectOptions = [
    ...new Set(
      sample.journals.flatMap((journal) => journal.subjectCategories ?? []),
    ),
  ]
    .map((subject) => subject.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 30);

  const topKeyword = rankedTags[0]?.[1]
    ? { label: rankedTags[0][1].name, count: rankedTags[0][1].count }
    : null;

  return {
    metrics: {
      totalPublications: articles.length,
      yearlyAverage: avg,
      emergingCount: emergingTopics.filter(
        (topic) => topic.momentum !== "growing",
      ).length,
      topKeyword,
      sampleHint: sample.articlesHasMore
        ? `Based on ${sample.articles.length}+ catalog articles`
        : `Based on ${sample.articles.length} catalog articles`,
    },
    keywords,
    multiTrend,
    growthComparison,
    velocityByYear,
    emergingTopics,
    topJournals,
    journalOptions: journalRows.slice(0, 40).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    subjectOptions,
  };
}
