import { ResolveScimagoJournalsUseCase } from './resolve-scimago-journals.use-case';
import { buildScimagoDataset } from '@repo/academic/domain/scimago.model';

describe('ResolveScimagoJournalsUseCase', () => {
  const records = [
    {
      year: 2025,
      sourceId: 'scimago-1',
      title: 'Journal One',
      type: 'journal',
      issns: ['1542-4863'],
      sjr: 1,
      hIndex: 1,
      rank: 1,
      bestQuartile: 'Q1',
      categories: [],
      areas: ['Medicine'],
    },
    {
      year: 2024,
      sourceId: 'scimago-1',
      title: 'Journal One',
      type: 'journal',
      issns: ['1542-4863'],
      sjr: 1,
      hIndex: 1,
      rank: 1,
      bestQuartile: 'Q1',
      categories: [],
      areas: ['Medicine'],
    },
  ];

  it('persists an exact match and stores 2023-2025 rankings outside article sync', async () => {
    const upsert = jest.fn();
    const graph = { upsertJournal: jest.fn() };
    const rankings = {
      upsertScimagoTaxonomy: jest.fn(),
      upsertScimagoJournalRanking: jest.fn(),
    };
    const useCase = new ResolveScimagoJournalsUseCase(
      {
        getJournalSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
          journalBackfillFromYear: 2020,
          dailyPageBudget: 1000,
          maxPagesPerPass: 10,
          sourceBatchSize: 100,
          journalBatchSize: 100,
          outgoingReferenceBatchSize: 100,
        }),
        getOpenAlexConfig: jest.fn(),
      },
      { load: jest.fn().mockResolvedValue(buildScimagoDataset(records)) },
      {
        fetchSourcesByIssns: jest.fn().mockResolvedValue({
          results: [
            {
              id: 'https://openalex.org/S1',
              type: 'journal',
              issn_l: '1542-4863',
            },
          ],
        }),
      },
      {
        findByScimagoSourceIds: jest.fn().mockResolvedValue([]),
        listMatchedForArticleSync: jest.fn(),
        upsert,
      },
      graph as never,
      rankings,
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      catalogYear: 2025,
      journals: 1,
      matched: 1,
      unmatched: 0,
      conflicts: 0,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scimagoSourceId: 'scimago-1',
        openAlexJournalId: 'S1',
        matchStatus: 'MATCHED',
      }),
    );
    expect(graph.upsertJournal).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'S1', scimagoSourceId: 'scimago-1' }),
    );
    expect(rankings.upsertScimagoJournalRanking).toHaveBeenCalledTimes(2);
  });

  it('marks a reverse source collision as conflict instead of choosing a journal', async () => {
    const collisionRecords = records.concat({
      ...records[0],
      sourceId: 'scimago-2',
      title: 'Journal Two',
    });
    const upsert = jest.fn();
    const useCase = new ResolveScimagoJournalsUseCase(
      {
        getJournalSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'url',
          journalBackfillFromYear: 2020,
          dailyPageBudget: 1000,
          maxPagesPerPass: 10,
          sourceBatchSize: 100,
          journalBatchSize: 100,
          outgoingReferenceBatchSize: 100,
        }),
        getOpenAlexConfig: jest.fn(),
      },
      {
        load: jest
          .fn()
          .mockResolvedValue(buildScimagoDataset(collisionRecords)),
      },
      {
        fetchSourcesByIssns: jest.fn().mockResolvedValue({
          results: [{ id: 'S1', type: 'journal', issn_l: '1542-4863' }],
        }),
      },
      {
        findByScimagoSourceIds: jest.fn().mockResolvedValue([]),
        listMatchedForArticleSync: jest.fn(),
        upsert,
      },
      { upsertJournal: jest.fn() } as never,
      {
        upsertScimagoTaxonomy: jest.fn(),
        upsertScimagoJournalRanking: jest.fn(),
      },
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      matched: 0,
      conflicts: 2,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        matchStatus: 'CONFLICT',
        openAlexJournalId: null,
      }),
    );
  });

  it('reports the failing OpenAlex source batch before any journal state is persisted', async () => {
    const secondJournal = {
      ...records[0],
      sourceId: 'scimago-2',
      title: 'Journal Two',
      issns: ['0007-9235'],
    };
    const fetchSourcesByIssns = jest
      .fn()
      .mockResolvedValueOnce({ results: [] })
      .mockRejectedValueOnce(new Error('code EAI_AGAIN: getaddrinfo failed'));
    const rankings = {
      upsertScimagoTaxonomy: jest.fn(),
      upsertScimagoJournalRanking: jest.fn(),
    };
    const states = {
      findByScimagoSourceIds: jest.fn(),
      listMatchedForArticleSync: jest.fn(),
      upsert: jest.fn(),
    };
    const useCase = new ResolveScimagoJournalsUseCase(
      {
        getJournalSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
          journalBackfillFromYear: 2020,
          dailyPageBudget: 1000,
          maxPagesPerPass: 10,
          sourceBatchSize: 1,
          journalBatchSize: 100,
          outgoingReferenceBatchSize: 100,
        }),
        getOpenAlexConfig: jest.fn(),
      },
      {
        load: jest
          .fn()
          .mockResolvedValue(buildScimagoDataset([records[0], secondJournal])),
      },
      { fetchSourcesByIssns },
      states,
      { upsertJournal: jest.fn() } as never,
      rankings,
    );

    await expect(useCase.execute()).rejects.toThrow(
      'OpenAlex source batch 2/2 (1 ISSNs) failed: code EAI_AGAIN: getaddrinfo failed',
    );
    expect(fetchSourcesByIssns).toHaveBeenCalledTimes(2);
    expect(rankings.upsertScimagoTaxonomy).not.toHaveBeenCalled();
    expect(states.upsert).not.toHaveBeenCalled();
  });
});
