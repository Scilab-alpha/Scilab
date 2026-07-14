import {
  JournalRankingDatasetNotFoundError,
  InvalidJournalRankingCursorError,
  ListJournalRankingsUseCase,
} from '@/academic/application/use-cases/list-journal-rankings/list-journal-rankings.use-case';
import { buildScimagoDataset } from '@/academic/domain/scimago.model';

describe('ListJournalRankingsUseCase', () => {
  const records = [
    {
      year: 2023,
      sourceId: 'first',
      title: 'First Journal',
      type: 'journal',
      issns: ['1111-1111'],
      sjr: 2.5,
      hIndex: 100,
      rank: 1,
      bestQuartile: 'Q1',
      totalDocs: 43,
      totalDocs3Years: 124,
      totalRefs: 3952,
      totalCitations3Years: 35985,
      citableDocs3Years: 89,
      citationsPerDoc2Years: 387.59,
      refsPerDoc: 91.91,
      femalePercentage: 45.26,
      countryCode: 'US',
      categories: [],
      areas: [],
    },
    {
      year: 2023,
      sourceId: 'second',
      title: 'Second Journal',
      type: 'journal',
      issns: ['2222-2222'],
      sjr: 1.5,
      hIndex: 10,
      rank: 2,
      bestQuartile: 'Q2',
      totalDocs: 10,
      totalDocs3Years: 30,
      totalRefs: 20,
      totalCitations3Years: 40,
      citableDocs3Years: 30,
      citationsPerDoc2Years: 1.5,
      refsPerDoc: 2,
      femalePercentage: 50,
      countryCode: 'VN',
      categories: [],
      areas: [],
    },
  ];

  it('lists the requested SCImago year with the required fields', async () => {
    const load = jest.fn().mockResolvedValue(buildScimagoDataset(records));
    const useCase = new ListJournalRankingsUseCase({ load });

    await expect(
      useCase.execute({ year: 2023, cursor: null, limit: 1 }),
    ).resolves.toEqual({
      items: [
        {
          title: 'First Journal',
          type: 'journal',
          sjr: 2.5,
          hIndex: 100,
          totalDocs: 43,
          totalDocs3Years: 124,
          totalRefs: 3952,
          totalCitations3Years: 35985,
          citableDocs3Years: 89,
          citationsPerDoc2Years: 387.59,
          refsPerDoc: 91.91,
          femalePercentage: 45.26,
          countryCode: 'US',
        },
      ],
      nextCursor: 'first',
    });
  });

  it('never falls back to another ranking year', async () => {
    const useCase = new ListJournalRankingsUseCase({
      load: () => Promise.resolve(buildScimagoDataset(records)),
    });

    await expect(
      useCase.execute({ year: 2024, cursor: null, limit: 20 }),
    ).rejects.toBeInstanceOf(JournalRankingDatasetNotFoundError);
  });

  it('rejects a cursor that does not belong to the requested year', async () => {
    const useCase = new ListJournalRankingsUseCase({
      load: () => Promise.resolve(buildScimagoDataset(records)),
    });

    await expect(
      useCase.execute({ year: 2023, cursor: 'missing', limit: 20 }),
    ).rejects.toBeInstanceOf(InvalidJournalRankingCursorError);
  });
});
