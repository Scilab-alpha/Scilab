import {
  ArticleGraph,
  CursorPage,
  CursorPaginationInput,
} from '@/academic/domain/academic-graph.model';

export type ListArticlesInput = CursorPaginationInput;

export type ListArticlesOutput = CursorPage<ArticleGraph>;
