import { OpenAlexJournalSourceRecord } from '@repo/academic/application/ports/openalex-source.port';
import { normalizeIssn } from '@repo/academic/domain/normalize-issn';
import { ScimagoRecord } from '@repo/academic/domain/scimago.model';

export interface ScimagoJournalSourceMatch {
  candidateJournalIds: string[];
  matchedJournalId: string | null;
  matchedIssn: string | null;
}

export function matchScimagoJournalToOpenAlexSources(
  record: ScimagoRecord,
  sources: OpenAlexJournalSourceRecord[],
): ScimagoJournalSourceMatch {
  const recordIssns = new Set(record.issns.map(normalizeIssn).filter(isString));
  const candidates = new Map<string, Set<string>>();

  for (const source of sources) {
    if (source.type?.toLowerCase() !== 'journal') {
      continue;
    }
    const sourceId = normalizeOpenAlexSourceId(source.id);
    if (!sourceId) {
      continue;
    }
    const matchingIssns = [source.issn_l, ...(source.issn ?? [])]
      .map(normalizeIssn)
      .filter(isString)
      .filter((issn) => recordIssns.has(issn));
    if (matchingIssns.length > 0) {
      candidates.set(sourceId, new Set(matchingIssns));
    }
  }

  const candidateJournalIds = [...candidates.keys()].sort();
  if (candidateJournalIds.length !== 1) {
    return { candidateJournalIds, matchedJournalId: null, matchedIssn: null };
  }

  const matchedJournalId = candidateJournalIds[0];
  return {
    candidateJournalIds,
    matchedJournalId,
    matchedIssn:
      [...(candidates.get(matchedJournalId) ?? [])].sort()[0] ?? null,
  };
}

export function normalizeOpenAlexSourceId(
  value?: string | null,
): string | null {
  const id = value?.replace('https://openalex.org/', '').trim();
  return id && /^S\d+$/i.test(id) ? id.toUpperCase() : null;
}

function isString(value: string | null): value is string {
  return value !== null;
}
