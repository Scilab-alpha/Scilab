import { matchScimagoJournalToOpenAlexSources } from '@repo/academic/application/services/scimago-journal-source.matcher';
import { ScimagoRecord } from '@repo/academic/domain/scimago.model';

const record: ScimagoRecord = {
  year: 2025,
  sourceId: '28773',
  title: 'Example Journal',
  type: 'journal',
  issns: ['1542-4863', '0007-9235'],
  sjr: null,
  hIndex: null,
  rank: null,
  bestQuartile: null,
  categories: [],
  areas: [],
};

describe('matchScimagoJournalToOpenAlexSources', () => {
  it('matches multiple ISSNs for one journal source', () => {
    expect(
      matchScimagoJournalToOpenAlexSources(record, [
        { id: 'https://openalex.org/S1', type: 'journal', issn: record.issns },
      ]),
    ).toEqual({
      candidateJournalIds: ['S1'],
      matchedJournalId: 'S1',
      matchedIssn: '0007-9235',
    });
  });

  it('does not match absent, ambiguous, or non-journal candidates', () => {
    expect(matchScimagoJournalToOpenAlexSources(record, [])).toMatchObject({
      candidateJournalIds: [],
      matchedJournalId: null,
    });
    expect(
      matchScimagoJournalToOpenAlexSources(record, [
        { id: 'S1', type: 'journal', issn_l: '1542-4863' },
        { id: 'S2', type: 'journal', issn_l: '0007-9235' },
      ]),
    ).toMatchObject({
      candidateJournalIds: ['S1', 'S2'],
      matchedJournalId: null,
    });
    expect(
      matchScimagoJournalToOpenAlexSources(record, [
        { id: 'S3', type: 'repository', issn_l: '1542-4863' },
      ]),
    ).toMatchObject({ candidateJournalIds: [], matchedJournalId: null });
  });
});
