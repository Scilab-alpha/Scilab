import {
  ArticleListInput,
  ArticleGraph,
  CursorPage,
} from '@repo/academic/domain/academic-graph.model';

export type ListArticlesInput = ArticleListInput;

export type ListArticlesOutput = CursorPage<ArticleGraph>;
