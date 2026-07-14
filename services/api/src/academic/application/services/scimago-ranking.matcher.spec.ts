import { matchOpenAlexWorkToScimago } from '@/academic/application/services/scimago-ranking.matcher';
import {
  buildScimagoDataset,
  ScimagoRecord,
} from '@/academic/domain/scimago.model';

const record: ScimagoRecord = {
  year: 2025,
  sourceId: 'source-1',
  title: 'Journal',
  issns: ['1542-4863', '0007-9235'],
  sjr: 1.2,
  hIndex: 10,
  rank: 1,
  bestQuartile: 'Q1',
  categories: [],
  areas: [],
};

describe('matchOpenAlexWorkToScimago', () => {
  it('matches by exact publication year and any source ISSN', () => {
    const result = matchOpenAlexWorkToScimago(
      {
        publication_year: 2025,
        primary_location: {
          source: {
            id: 'https://openalex.org/S1',
            issn: ['0007-9235'],
            issn_l: '1542-4863',
          },
        },
      },
      buildScimagoDataset([record]),
    );

    expect(result).toMatchObject({
      status: 'MATCHED',
      journalId: 'S1',
      year: 2025,
      record,
    });
  });

  it('does not fall back to another year', () => {
    const result = matchOpenAlexWorkToScimago(
      {
        publication_year: 2024,
        primary_location: { source: { id: 'S1', issn: ['1542-4863'] } },
      },
      buildScimagoDataset([record]),
    );

    expect(result).toEqual({ status: 'UNMATCHED' });
  });

  it('returns a conflict when ISSNs map to distinct SCImago sources', () => {
    const result = matchOpenAlexWorkToScimago(
      {
        publication_year: 2025,
        primary_location: { source: { id: 'S1', issn: ['1542-4863'] } },
      },
      buildScimagoDataset([
        record,
        { ...record, sourceId: 'source-2', title: 'Journal two' },
      ]),
    );

    expect(result).toMatchObject({ status: 'CONFLICT', journalId: 'S1' });
  });
});
