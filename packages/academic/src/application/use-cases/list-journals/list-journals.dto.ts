import {
  CursorPage,
  CursorPaginationInput,
  JournalListItem,
} from '@repo/academic/domain/academic-graph.model';

export type ListJournalsInput = CursorPaginationInput;

export type ListJournalsOutput = CursorPage<JournalListItem>;
