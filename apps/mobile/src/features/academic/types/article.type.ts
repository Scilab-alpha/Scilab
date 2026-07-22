export type AcademicNodeType =
  | "ARTICLE"
  | "AUTHOR"
  | "JOURNAL"
  | "KEYWORD"
  | "TOPIC";

export type ArticleNode = {
  abstract: string | null;
  citationCount: number | null;
  createdAt: string | null;
  doi: string | null;
  id: string;
  issueNumber: string | null;
  publicationYear: number | null;
  title: string;
  updatedAt: string | null;
  version: string | null;
  volumeNumber: number | string | null;
};

export type AuthorNode = {
  authorPosition: number | null;
  displayName: string | null;
  id: string;
  imageUrl: string | null;
  orcid: string | null;
};

export type AuthorListItem = Omit<AuthorNode, "authorPosition"> & {
  articleCount: number;
};

export type JournalNode = {
  country: string | null;
  coverage: string | null;
  displayName: string | null;
  id: string;
  isOaDiamond: boolean | null;
  isOpenAccess: boolean | null;
  issnList: string[] | null;
  publisherImageUrl: string | null;
  publisherName: string | null;
  region: string | null;
  sourceId: string | null;
  subjectCategories: string[] | null;
  type: string | null;
};

export type JournalListItem = JournalNode & {
  articleCount: number;
};

export type KeywordNode = {
  displayName: string | null;
  id: string;
  score: number | null;
};

export type TopicNode = {
  displayName: string | null;
  id: string;
  isPrimary: boolean | null;
  score: number | null;
};

export type ArticleGraph = {
  article: ArticleNode;
  authors: AuthorNode[];
  citedArticleIds: string[];
  journal: JournalNode | null;
  keywords: KeywordNode[];
  topics: TopicNode[];
};

export type CursorPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type ArticleListParams = {
  cursor?: string | null;
  keywordId?: string | null;
  limit?: number;
  publicationYear?: number | null;
  publicationYearFrom?: number | null;
  publicationYearTo?: number | null;
  q?: string | null;
  sort?: "relevant" | "newest" | "most_cited" | null;
  topicId?: string | null;
};
