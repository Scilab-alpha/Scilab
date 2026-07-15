import {
  ArticleGraphPage,
  ArticleGraphQueryInput,
} from '@/visualize/domain/article-graph-visualization.model';

export const ARTICLE_GRAPH_VISUALIZATION_REPOSITORY = Symbol(
  'ARTICLE_GRAPH_VISUALIZATION_REPOSITORY',
);

export interface ArticleGraphVisualizationRepository {
  getArticleGraph(
    input: ArticleGraphQueryInput,
  ): Promise<ArticleGraphPage | null>;
}
