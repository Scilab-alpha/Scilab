import { listArticles } from "@/features/experiments/api/articles.api";
import { listJournals } from "@/features/experiments/api/journals.api";
import type { ArticleGraph } from "@/features/experiments/types/article.types";
import type { JournalListItem } from "@/features/experiments/types/journal.types";

export type CatalogSnapshot = {
  articles: ArticleGraph[];
  journals: JournalListItem[];
  articlesHasMore: boolean;
  journalsHasMore: boolean;
};

const ARTICLE_PAGE_LIMIT = 50;
const ARTICLE_PAGES = 2;
const JOURNAL_LIMIT = 50;

/** Pull a bounded snapshot composed exclusively of live backend records. */
export async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const [journalsPage, firstArticles] = await Promise.all([
    listJournals({ limit: JOURNAL_LIMIT }),
    listArticles({ limit: ARTICLE_PAGE_LIMIT }),
  ]);

  const articles = [...firstArticles.items];
  let articlesHasMore = Boolean(firstArticles.nextCursor);
  let cursor = firstArticles.nextCursor;

  for (let page = 1; page < ARTICLE_PAGES && cursor; page += 1) {
    const next = await listArticles({ limit: ARTICLE_PAGE_LIMIT, cursor });
    articles.push(...next.items);
    cursor = next.nextCursor;
    articlesHasMore = Boolean(next.nextCursor);
  }

  return {
    articles,
    journals: journalsPage.items,
    articlesHasMore,
    journalsHasMore: Boolean(journalsPage.nextCursor),
  };
}
