import {
  AuthorListItem,
  CursorPage,
  CursorPaginationInput,
} from '@/academic/domain/academic-graph.model';

export type ListAuthorsInput = CursorPaginationInput;

export type ListAuthorsOutput = CursorPage<AuthorListItem>;
