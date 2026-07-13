import {
  CursorPage,
  CursorPaginationInput,
  JournalListItem,
} from '@/academic/domain/academic-graph.model';

export type ListJournalsInput = CursorPaginationInput;

export type ListJournalsOutput = CursorPage<JournalListItem>;
