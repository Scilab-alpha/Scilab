export type AcademicNodeType =
  | 'ARTICLE'
  | 'AUTHOR'
  | 'JOURNAL'
  | 'KEYWORD'
  | 'TOPIC';

export type ArticleHydrationState = 'PLACEHOLDER' | 'HYDRATED';
export type ArticleSort = 'relevant' | 'newest' | 'most_cited';

export interface ArticleNode {
  id: string;
  title: string;
  abstract?: string | null;
  doi?: string | null;
  publicationYear?: number | null;
  version?: string | null;
  volumeNumber?: number | string | null;
  issueNumber?: string | null;
  citationCount?: number | null;
  hydrationState?: ArticleHydrationState;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface AuthorNode {
  id: string;
  orcid?: string | null;
  displayName?: string | null;
  imageUrl?: string | null;
  authorPosition?: number | null;
}

export interface JournalNode {
  id: string;
  sourceId?: string | null;
  displayName?: string | null;
  type?: string | null;
  isOpenAccess?: boolean | null;
  isOaDiamond?: boolean | null;
  coverage?: string | null;
  country?: string | null;
  issnList?: string[] | null;
  publisherName?: string | null;
  publisherImageUrl?: string | null;
  subjectCategories?: string[] | null;
  scimagoSourceId?: string | null;
  scimagoCatalogYear?: number | null;
}

export interface KeywordNode {
  id: string;
  displayName?: string | null;
  score?: number | null;
}

export interface TopicNode {
  id: string;
  displayName?: string | null;
  score?: number | null;
  isPrimary?: boolean | null;
}

export interface ArticleGraph {
  article: ArticleNode;
  journal?: JournalNode | null;
  authors?: AuthorNode[];
  keywords?: KeywordNode[];
  topics?: TopicNode[];
  citedArticleIds?: string[];
}

export interface CursorPaginationInput {
  cursor?: string | null;
  limit: number;
}

export interface ArticleListInput extends CursorPaginationInput {
  q?: string | null;
  keywordId?: string | null;
  topicId?: string | null;
  authorId?: string | null;
  journalId?: string | null;
  publicationYear?: number | null;
  publicationYearFrom?: number | null;
  publicationYearTo?: number | null;
  publisher?: string | null;
  country?: string | null;
  sort: ArticleSort;
}

export interface CursorPage<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export type AuthorListItem = Omit<AuthorNode, 'authorPosition'> & {
  articleCount: number;
};

export interface JournalListItem extends JournalNode {
  articleCount: number;
}

export class InvalidArticleListCursorError extends Error {
  constructor() {
    super('cursor is invalid for this article query');
    this.name = 'InvalidArticleListCursorError';
  }
}
