import { ArticleGraph } from '@repo/academic/domain/academic-graph.model';

export interface GetArticleByIdInput {
  articleId: string;
}

export type GetArticleByIdOutput = ArticleGraph | null;
