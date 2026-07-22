import { ArticleGraphVisualization } from '@/visualize/domain/article-graph-visualization.model';

export interface GetArticleGraphInput {
  articleId: string;
  cursor?: string | null;
  limit: number;
}

export type GetArticleGraphOutput = ArticleGraphVisualization;
