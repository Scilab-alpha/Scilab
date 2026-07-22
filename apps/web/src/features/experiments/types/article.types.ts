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
  q?: string | null;
  limit?: number;
  keywordId?: string | null;
  topicId?: string | null;
  authorId?: string | null;
  journalId?: string | null;
  publicationYear?: number;
  publicationYearFrom?: number;
  publicationYearTo?: number;
  publisher?: string | null;
  country?: string | null;
  sort?: "relevant" | "newest" | "most_cited";
};
export type ArticleListResponse = CursorPage<ArticleGraph>;
export type ArticleDetailResponse = ArticleGraph;
