import type { DashboardInsights } from "@/features/dashboard/lib/build-dashboard-insights";
import type { AdvancedDashboardInsights } from "@/features/dashboard/lib/build-advanced-dashboard-insights";
import {
  downloadBlob,
  rowsToCsv,
  stampFilename,
} from "@/features/dashboard/utils/export-download";

/** Flatten main dashboard insights into a multi-section CSV. */
export function buildDashboardCsv(data: DashboardInsights) {
  const chunks: string[] = [];

  chunks.push(
    rowsToCsv(
      ["section", "label", "value", "hint", "change_percent", "direction"],
      data.stats.map((stat) => [
        "stats",
        stat.label,
        stat.value,
        stat.hint,
        stat.changePercent,
        stat.direction,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "year", "publications"],
      data.publicationGrowth.map((row) => [
        "publication_growth",
        row.year,
        row.publications,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "year", "articles"],
      data.yearDistribution.map((row) => [
        "year_distribution",
        row.year,
        row.articles,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "topic", "count", "change_percent", "trend"],
      data.trendingTopics.map((row) => [
        "trending_topics",
        row.topic,
        row.count,
        row.change,
        row.trend,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "journal_id", "name", "articles", "last_update", "trend"],
      data.recentJournals.map((row) => [
        "top_journals",
        row.id,
        row.name,
        row.articles,
        row.lastUpdate,
        row.trend,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      [
        "section",
        "publication_id",
        "title",
        "journal",
        "year",
        "outgoing_refs",
      ],
      data.recentPublications.map((row) => [
        "recent_publications",
        row.id,
        row.title,
        row.journal,
        row.year,
        row.citations,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "articles_sampled", "journals_sampled", "articles_has_more", "journals_has_more"],
      [
        [
          "sample",
          data.sampleSize.articles,
          data.sampleSize.journals,
          data.sampleSize.articlesHasMore ? "yes" : "no",
          data.sampleSize.journalsHasMore ? "yes" : "no",
        ],
      ],
    ).trimEnd(),
  );

  return `${chunks.join("\n\n")}\n`;
}

export function downloadDashboardCsv(data: DashboardInsights) {
  const csv = buildDashboardCsv(data);
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    stampFilename("scilab-dashboard", "csv"),
  );
}

/** Flatten advanced dashboard insights into CSV sections. */
export function buildAdvancedDashboardCsv(data: AdvancedDashboardInsights) {
  const chunks: string[] = [];

  chunks.push(
    rowsToCsv(
      ["section", "key", "label", "color"],
      data.keywordLines.map((line) => [
        "keyword_lines",
        line.key,
        line.label,
        line.color,
      ]),
    ).trimEnd(),
  );

  const seriesHeaders = [
    "section",
    "year",
    ...data.keywordLines.map((line) => line.key),
  ];
  chunks.push(
    rowsToCsv(
      seriesHeaders,
      data.keywordComparisonSeries.map((row) => [
        "keyword_comparison",
        row.year,
        ...data.keywordLines.map((line) => row[line.key] ?? 0),
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "topic", ...data.heatmapColumns.map((col) => `year_${col}`)],
      data.heatmapRows.map((row) => [
        "activity_heatmap",
        row.label,
        ...row.values,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      [
        "section",
        "journal_id",
        "journal",
        "current_rank",
        "previous_rank",
        "article_count",
      ],
      data.rankingProgress.map((row) => [
        "journal_ranking",
        row.id,
        row.journal,
        row.currentRank,
        row.previousRank,
        row.articleCount,
      ]),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(
      ["section", "journal_id", "period", "rank"],
      data.rankingProgress.flatMap((row) =>
        row.timeline.map((point) => [
          "ranking_timeline",
          row.id,
          point.period,
          point.rank,
        ]),
      ),
    ).trimEnd(),
  );

  chunks.push(
    rowsToCsv(["section", "hint"], [["sample", data.sampleHint]]).trimEnd(),
  );

  return `${chunks.join("\n\n")}\n`;
}

export function downloadAdvancedDashboardCsv(data: AdvancedDashboardInsights) {
  const csv = buildAdvancedDashboardCsv(data);
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    stampFilename("scilab-advanced-dashboard", "csv"),
  );
}
