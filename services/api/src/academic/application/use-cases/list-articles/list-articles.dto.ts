import {
  ArticleListInput,
  ArticleGraph,
  CursorPage,
} from '@/academic/domain/academic-graph.model';

export type ListArticlesInput = ArticleListInput;

export type ListArticlesOutput = CursorPage<ArticleGraph>;
