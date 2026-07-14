import { OpenAlexWorkRecord } from '@/academic/application/ports/openalex-work-source.port';
import {
  createScimagoDictionaryKey,
  ScimagoDataset,
  ScimagoRecord,
} from '@/academic/domain/scimago.model';
import { normalizeIssn } from '@/academic/domain/normalize-issn';

export type ScimagoRankingMatch =
  | {
      status: 'MATCHED';
      journalId: string;
      year: number;
      record: ScimagoRecord;
    }
  | { status: 'UNMATCHED' }
  | {
      status: 'CONFLICT';
      journalId: string;
      year: number;
      records: ScimagoRecord[];
    };

export function matchOpenAlexWorkToScimago(
  work: OpenAlexWorkRecord,
  dataset: ScimagoDataset,
): ScimagoRankingMatch {
  const year = work.publication_year;
  const source = work.primary_location?.source;
  const journalId = normalizeOpenAlexId(source?.id);

  if (!year || !source || !journalId || !dataset.years.has(year)) {
    return { status: 'UNMATCHED' };
  }

  const issns = [...(source.issn ?? []), source.issn_l ?? '']
    .map(normalizeIssn)
    .filter((issn): issn is string => Boolean(issn));
  const candidates = new Map<string, ScimagoRecord>();

  for (const issn of new Set(issns)) {
    for (const record of dataset.dictionary.get(
      createScimagoDictionaryKey(year, issn),
    ) ?? []) {
      candidates.set(record.sourceId, record);
    }
  }

  const records = [...candidates.values()];

  if (records.length === 0) {
    return { status: 'UNMATCHED' };
  }

  if (records.length > 1) {
    return { status: 'CONFLICT', journalId, year, records };
  }

  return { status: 'MATCHED', journalId, year, record: records[0] };
}

function normalizeOpenAlexId(value?: string | null): string | null {
  const normalized = value?.replace('https://openalex.org/', '').trim();
  return normalized || null;
}
