import type {
  ArticleGraph,
  ArticleNode,
  AuthorNode,
  JournalNode,
  KeywordNode,
  TopicNode,
} from "@/types/academic.type";

export type BookmarkListParams = {
  limit?: number;
  page?: number;
};

export type BookmarkedArticle = {
  article: ArticleGraph;
  articleId: string;
  bookmarkedAt: string;
};

export type BookmarkPage = {
  hasMore: boolean;
  items: BookmarkedArticle[];
  limit: number;
  page: number;
};

export type ToggleBookmarkResult = {
  articleId: string;
  bookmarked: boolean;
  bookmarkedAt?: string;
};

export type BookmarkArticlePayload = ArticleNode & {
  authors?: AuthorNode[] | null;
  citedArticleIds?: string[] | null;
  journal?: JournalNode | null;
  keywords?: KeywordNode[] | null;
  topics?: TopicNode[] | null;
};
