import { listArticles } from "@/features/experiments/api/articles.api";
import { listJournals } from "@/features/experiments/api/journals.api";
import type { ArticleGraph } from "@/features/experiments/types/article.types";
import type { JournalListItem } from "@/features/experiments/types/journal.types";

export type CatalogSample = {
  articles: ArticleGraph[];
  journals: JournalListItem[];
  articlesHasMore: boolean;
  journalsHasMore: boolean;
};

/** API max page size for academic list endpoints. */
const CATALOG_PAGE_LIMIT = 100;

/** Publication-year window used by Dashboard, Advanced Dashboard, and Trends. */
export const CATALOG_INSIGHT_YEAR_FROM = 2023;
export const CATALOG_INSIGHT_YEAR_TO = 2025;
export const CATALOG_INSIGHT_YEARS: number[] = [2023, 2024, 2025];

export function isInsightPublicationYear(year: number | null | undefined) {
  return (
    typeof year === "number" &&
    year >= CATALOG_INSIGHT_YEAR_FROM &&
    year <= CATALOG_INSIGHT_YEAR_TO
  );
}

export function filterArticlesToInsightYears(articles: ArticleGraph[]) {
  return articles.filter((item) =>
    isInsightPublicationYear(item.article.publicationYear),
  );
}

/**
 * Pull 100 articles (2023–2025) + 100 journals from the academic API
 * for dashboard / trend aggregation (no nested paging).
 */
export async function fetchCatalogSample(): Promise<CatalogSample> {
  const [journalsPage, articlesPage] = await Promise.all([
    listJournals({ limit: CATALOG_PAGE_LIMIT }),
    listArticles({
      limit: CATALOG_PAGE_LIMIT,
      publicationYearFrom: CATALOG_INSIGHT_YEAR_FROM,
      publicationYearTo: CATALOG_INSIGHT_YEAR_TO,
    }),
  ]);

  const articles = filterArticlesToInsightYears(articlesPage.items);

  return {
    articles,
    journals: journalsPage.items,
    articlesHasMore: Boolean(articlesPage.nextCursor),
    journalsHasMore: Boolean(journalsPage.nextCursor),
  };
}
