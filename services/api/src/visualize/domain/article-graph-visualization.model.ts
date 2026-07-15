export type ArticleGraphNodeType = 'article' | 'year';
export type ArticleGraphEdgeType = 'RELATED_TO' | 'PUBLISHED_IN_YEAR';

export interface ArticleGraphNode {
  id: string;
  type: ArticleGraphNodeType;
  label: string;
}

export interface ArticleGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: ArticleGraphEdgeType;
}

export interface ArticleGraphVisualization {
  edges: ArticleGraphEdge[];
  nextCursor: string | null;
  nodes: ArticleGraphNode[];
  truncated: boolean;
}

export interface ArticleGraphCursor {
  articleId: string;
  rank: number;
  tier: 0 | 1;
}

export interface ArticleGraphQueryInput {
  articleId: string;
  cursor: ArticleGraphCursor | null;
  limit: number;
}

export interface VisualizedArticle {
  id: string;
  publicationYear: number | null;
  title: string;
}

export interface VisualizedNeighbor extends VisualizedArticle {
  rank: number;
  tier: 0 | 1;
}

export interface StoredRelatedEdge {
  sourceArticleId: string;
  targetArticleId: string;
}

export interface ArticleGraphPage {
  edges: StoredRelatedEdge[];
  neighbors: VisualizedNeighbor[];
  root: VisualizedArticle;
}

export class ArticleGraphNotFoundError extends Error {
  constructor() {
    super('Article not found');
    this.name = 'ArticleGraphNotFoundError';
  }
}

export class InvalidArticleGraphCursorError extends Error {
  constructor() {
    super('cursor is invalid for this article graph');
    this.name = 'InvalidArticleGraphCursorError';
  }
}
