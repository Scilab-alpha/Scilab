import {
  ScimagoRecord,
  ScimagoSubjectCategory,
} from '@repo/academic/domain/scimago.model';

export const JOURNAL_RANKING_REPOSITORY = Symbol('JOURNAL_RANKING_REPOSITORY');

export interface UpsertScimagoTaxonomyInput {
  subjectAreas: string[];
  subjectCategories: ScimagoSubjectCategory[];
}

export interface UpsertScimagoJournalRankingInput {
  journalId: string;
  year: number;
  record: ScimagoRecord;
}

export interface JournalRankingRepository {
  upsertScimagoTaxonomy(input: UpsertScimagoTaxonomyInput): Promise<void>;
  upsertScimagoJournalRanking(
    input: UpsertScimagoJournalRankingInput,
  ): Promise<number>;
}
