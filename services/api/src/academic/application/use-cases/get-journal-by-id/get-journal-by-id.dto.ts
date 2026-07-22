import { JournalListItem } from '@/academic/domain/academic-graph.model';

export interface GetJournalByIdInput {
  journalId: string;
}

export type GetJournalByIdOutput = JournalListItem | null;
