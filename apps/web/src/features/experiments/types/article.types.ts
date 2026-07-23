import type { CursorPage } from "@/features/experiments/types/academic-pagination.types";
import type { JournalNode } from "@/features/experiments/types/journal.types";

export type { CursorPage } from "@/features/experiments/types/academic-pagination.types";

export type AcademicNodeType =
  | "ARTICLE"
  | "AUTHOR"
  | "JOURNAL"
  | "KEYWORD"
  | "TOPIC";

/** Core article fields from GET /academic/articles and article graph payloads. */
export type ArticleNode = {
  id: string;
  title: string;
  abstract: string | null;
  doi: string | null;
  publicationYear: number | null;
  version: string | null;
  volumeNumber: number | string | null;
  issueNumber: string | null;
  /** OpenAlex cited_by_count (inbound citations). */
  citationCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuthorNode = {
  id: string;
  orcid: string | null;
  displayName: string | null;
  imageUrl: string | null;
  authorPosition: number | null;
};

export type KeywordNode = {
  id: string;
  displayName: string | null;
  score: number | null;
};

export type TopicNode = {
  id: string;
  displayName: string | null;
  score: number | null;
  isPrimary: boolean | null;
};

/** One article item returned by list/detail academic endpoints. */
export type ArticleGraph = {
  article: ArticleNode;
  journal: JournalNode | null;
  authors: AuthorNode[];
  keywords: KeywordNode[];
  topics: TopicNode[];
  citedArticleIds: string[];
};

export type ArticleListParams = {
  cursor?: string | null;
  /** Free-text search (`q` on GET /academic/articles). */
  q?: string | null;
  keywordId?: string | null;
  topicId?: string | null;
  authorId?: string | null;
  /** Exact journal id (`journalId` on GET /academic/articles). */
  journalId?: string | null;
  publicationYear?: number | string | null;
  publicationYearFrom?: number | string | null;
  publicationYearTo?: number | string | null;
  publisher?: string | null;
  /** ISO 3166-1 alpha-2 country code. */
  country?: string | null;
  sort?: ArticleSort | null;
  limit?: number;
};

export type ArticleSort = "relevant" | "newest" | "most_cited";

/**
 * UI sort for Article Search. `most_related` is client-only (API has no graph-node sort);
 * list is fetched as newest then ordered by related-work / graph node count.
 */
export type ArticleClientSort = ArticleSort | "most_related";

/** Filters sent to GET /academic/articles (excluding cursor/limit/q). */
export type ArticleApiFilters = {
  keywordId?: string;
  topicId?: string;
  journalId?: string;
  publicationYear?: string;
  publicationYearFrom?: string;
  publicationYearTo?: string;
  publisher?: string;
  country?: string;
  sort?: ArticleSort;
};

export type ArticleListResponse = CursorPage<ArticleGraph>;
export type ArticleDetailResponse = ArticleGraph;

export const yearOptions = ["2025", "2024", "2023"];

export const articleSortOptions: {
  value: ArticleClientSort;
  label: string;
}[] = [
  { value: "most_related", label: "Most graph nodes" },
  { value: "newest", label: "Newest first" },
  { value: "most_cited", label: "Most cited" },
  { value: "relevant", label: "Partial match (relevant)" },
];

/** Minimum related-work / graph neighbor counts for the sidebar filter. */
export const graphNodeFilterOptions: { value: string; label: string }[] = [
  { value: "", label: "Any size" },
  { value: "1", label: "1+ nodes" },
  { value: "5", label: "5+ nodes" },
  { value: "10", label: "10+ nodes" },
  { value: "20", label: "20+ nodes" },
  { value: "50", label: "50+ nodes" },
  { value: "100", label: "100+ nodes" },
  { value: "500", label: "500+ nodes" },
];

/** Map UI sort to the academic list API sort. */
export function toArticleApiSort(sort: ArticleClientSort): ArticleSort {
  // Fetch a mixed newest page, then client-sort by graph/citation strength.
  // (most_cited first pages are all high-citation, so graph filters look broken.)
  return sort === "most_related" ? "newest" : sort;
}

export const countryFilterOptions: { value: string; label: string }[] = [
  { value: "US", label: "United States (US)" },
  { value: "GB", label: "United Kingdom (GB)" },
  { value: "NL", label: "Netherlands (NL)" },
  { value: "DE", label: "Germany (DE)" },
  { value: "CN", label: "China (CN)" },
  { value: "JP", label: "Japan (JP)" },
  { value: "FR", label: "France (FR)" },
  { value: "CA", label: "Canada (CA)" },
  { value: "AU", label: "Australia (AU)" },
  { value: "KR", label: "South Korea (KR)" },
  { value: "IT", label: "Italy (IT)" },
  { value: "ES", label: "Spain (ES)" },
  { value: "CH", label: "Switzerland (CH)" },
  { value: "SE", label: "Sweden (SE)" },
  { value: "IN", label: "India (IN)" },
  { value: "SG", label: "Singapore (SG)" },
  { value: "BR", label: "Brazil (BR)" },
];

export interface ArticleSearchProps {
  onNavigate?: (view: string) => void;
  onViewArticle?: (articleId: string) => void;
}
