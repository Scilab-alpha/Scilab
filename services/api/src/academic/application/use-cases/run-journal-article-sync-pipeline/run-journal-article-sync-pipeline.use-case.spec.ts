import { RunJournalArticleSyncPipelineUseCase } from './run-journal-article-sync-pipeline.use-case';

describe('RunJournalArticleSyncPipelineUseCase', () => {
  it('starts at cursor star, persists only after the page succeeds, and omits references', async () => {
    const upsert = jest.fn();
    const fetchWorks = jest.fn().mockResolvedValue({
      meta: { next_cursor: null },
      results: [
        {
          id: 'https://openalex.org/W1',
          title: 'Article',
          referenced_works: ['https://openalex.org/W2'],
        },
      ],
    });
    const useCase = new RunJournalArticleSyncPipelineUseCase(
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
        listMatchedForArticleSync: jest.fn().mockResolvedValue([
          {
            scimagoSourceId: 'source',
            catalogYear: 2025,
            openAlexJournalId: 'S1',
            matchStatus: 'MATCHED',
            matchedIssn: '1542-4863',
            candidateJournalIds: ['S1'],
            syncMode: 'BACKFILL',
            cursor: null,
            filterSignature: null,
            incrementalWindowFrom: null,
            initialBackfillComplete: false,
            lastResolvedAt: null,
            lastSuccessfulAt: null,
            errorDetail: null,
          },
        ]),
        findByScimagoSourceIds: jest.fn(),
        upsert,
      },
      { fetchWorks, fetchWorksByIds: jest.fn() },
      {
        upsertArticleGraphs: jest
          .fn()
          .mockResolvedValue({ inserted: 1, updated: 0 }),
      } as never,
      { tryConsume: jest.fn().mockResolvedValue(true) },
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      pagesFetched: 1,
      articlesInserted: 1,
    });
    const [calledInput] = fetchWorks.mock.calls[0] as unknown as [
      { cursor: string; config: { filter: string } },
    ];
    expect(calledInput.cursor).toBe('*');
    expect(calledInput.config.filter).toBe(
      'primary_location.source.id:S1,type:article,from_publication_date:2020-01-01',
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ initialBackfillComplete: true, cursor: null }),
    );
  });
});
