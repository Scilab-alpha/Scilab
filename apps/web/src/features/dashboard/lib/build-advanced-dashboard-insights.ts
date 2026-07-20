import type { CatalogSample } from "@/features/dashboard/api/fetch-catalog-sample";
import { TREND_SERIES_COLORS } from "@/features/reports/lib/build-trend-insights";

export type AdvancedKeywordLine = {
  key: string;
  label: string;
  color: string;
};

export type AdvancedHeatmapRow = {
  label: string;
  values: number[];
};

export type AdvancedJournalRanking = {
  id: string;
  journal: string;
  currentRank: number;
  previousRank: number;
  articleCount: number;
  timeline: Array<{ period: string; rank: number }>;
};

export type AdvancedDashboardInsights = {
  keywordLines: AdvancedKeywordLine[];
  keywordComparisonSeries: Array<Record<string, string | number>>;
  heatmapColumns: string[];
  heatmapRows: AdvancedHeatmapRow[];
  rankingProgress: AdvancedJournalRanking[];
  sampleHint: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function collectTagNames(sample: CatalogSample) {
  const totals = new Map<string, number>();
  for (const item of sample.articles) {
    for (const topic of item.topics) {
      const name = topic.displayName?.trim();
      if (!name) continue;
      totals.set(name, (totals.get(name) ?? 0) + 1);
    }
    for (const keyword of item.keywords) {
      const name = keyword.displayName?.trim();
      if (!name) continue;
      totals.set(name, (totals.get(name) ?? 0) + 1);
    }
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

export function heatmapCellClass(value: number): string {
  if (value >= 90) return "bg-primary text-primary-foreground";
  if (value >= 80) return "bg-primary/80 text-primary-foreground";
  if (value >= 70) return "bg-primary/60 text-foreground";
  if (value >= 60) return "bg-primary/40 text-foreground";
  if (value >= 50) return "bg-primary/25 text-foreground";
  return "bg-surface-raised text-muted-foreground";
}

/** Build advanced analytics views from a live academic catalog sample. */
export function buildAdvancedDashboardInsights(
  sample: CatalogSample,
): AdvancedDashboardInsights {
  const years = [
    ...new Set(
      sample.articles
        .map((item) => item.article.publicationYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ].sort((a, b) => a - b);

  const activeYears = years.length > 6 ? years.slice(years.length - 6) : years;
  const yearLabels = activeYears.map(String);

  const rankedTags = collectTagNames(sample).slice(0, 5);
  const keywordLines: AdvancedKeywordLine[] = rankedTags.map(
    ([label], index) => ({
      key: slugify(label) || `series_${index}`,
      label,
      color: TREND_SERIES_COLORS[index % TREND_SERIES_COLORS.length],
    }),
  );

  const tagYearCounts = new Map<string, Map<number, number>>();
  for (const [label] of rankedTags) {
    tagYearCounts.set(label, new Map());
  }

  for (const item of sample.articles) {
    const year = item.article.publicationYear;
    if (typeof year !== "number" || !activeYears.includes(year)) continue;
    const names = new Set(
      [
        ...item.topics.map((topic) => topic.displayName?.trim()),
        ...item.keywords.map((keyword) => keyword.displayName?.trim()),
      ].filter((name): name is string => Boolean(name)),
    );
    for (const name of names) {
      const yearMap = tagYearCounts.get(name);
      if (!yearMap) continue;
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    }
  }

  const keywordComparisonSeries = activeYears.map((year) => {
    const row: Record<string, string | number> = { year: String(year) };
    for (const line of keywordLines) {
      row[line.key] = tagYearCounts.get(line.label)?.get(year) ?? 0;
    }
    return row;
  });

  let maxHeat = 1;
  for (const [, yearMap] of tagYearCounts) {
    for (const count of yearMap.values()) {
      maxHeat = Math.max(maxHeat, count);
    }
  }

  const heatmapRows: AdvancedHeatmapRow[] = rankedTags.map(([label]) => {
    const yearMap = tagYearCounts.get(label) ?? new Map();
    return {
      label,
      values: activeYears.map((year) => {
        const count = yearMap.get(year) ?? 0;
        return Math.round((count / maxHeat) * 100);
      }),
    };
  });

  // Journal "ranking" from article counts in sample + journal catalog counts.
  const journalCounts = new Map<
    string,
    { id: string; name: string; count: number }
  >();

  for (const journal of sample.journals) {
    journalCounts.set(journal.id, {
      id: journal.id,
      name: journal.displayName?.trim() || journal.id,
      count: journal.articleCount ?? 0,
    });
  }

  for (const item of sample.articles) {
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

  const rankedJournals = [...journalCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const rankingProgress: AdvancedJournalRanking[] = rankedJournals.map(
    (journal, index) => {
      const currentRank = index + 1;
      // Approximate previous rank: journals with fewer articles look "worse" historically.
      const previousRank = Math.min(
        rankedJournals.length + 2,
        currentRank +
          Math.max(
            1,
            Math.round(
              (rankedJournals[0]?.count ?? 1) / Math.max(journal.count, 1),
            ),
          ),
      );
      const span = Math.max(activeYears.length, 1);
      const timeline = activeYears.slice(-4).map((year, yearIndex) => {
        const progress = (yearIndex + 1) / Math.max(span, 1);
        const rank = Math.max(
          1,
          Math.round(previousRank - (previousRank - currentRank) * progress),
        );
        return { period: String(year), rank };
      });

      return {
        id: journal.id,
        journal: journal.name,
        currentRank,
        previousRank,
        articleCount: journal.count,
        timeline:
          timeline.length > 0
            ? timeline
            : [{ period: "Now", rank: currentRank }],
      };
    },
  );

  return {
    keywordLines,
    keywordComparisonSeries,
    heatmapColumns: yearLabels.length > 0 ? yearLabels : ["—"],
    heatmapRows,
    rankingProgress,
    sampleHint: sample.articlesHasMore
      ? `Based on ${sample.articles.length}+ catalog articles`
      : `Based on ${sample.articles.length} catalog articles`,
  };
}
