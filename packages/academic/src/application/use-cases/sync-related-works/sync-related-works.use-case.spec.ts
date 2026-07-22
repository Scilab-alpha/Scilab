import { SyncRelatedWorksUseCase } from './sync-related-works.use-case';

describe('SyncRelatedWorksUseCase', () => {
  it('refreshes eligible stale roots in configured batches and stores ordered snapshots', async () => {
    const replaceRelatedWorkSnapshots = jest.fn().mockResolvedValue(undefined);
    const fetchRelatedWorksByIds = jest.fn().mockResolvedValue({
      results: [
        {
          id: 'https://openalex.org/W1',
          type: 'article',
          related_works: [
            'https://openalex.org/W2',
            'https://openalex.org/W1',
            'https://openalex.org/W3',
          ],
        },
      ],
    });
    const useCase = new SyncRelatedWorksUseCase(
      {
        getJournalSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'url',
          journalBackfillFromYear: 2020,
          dailyPageBudget: 1000,
          priorityPercent: 80,
          maxPagesPerPass: 10,
          sourceBatchSize: 100,
          journalBatchSize: 100,
          outgoingReferenceBatchSize: 100,
          relatedRefreshDays: 30,
          relatedRootBatchSize: 1,
          relatedRootMaxBatches: 1,
          relatedTargetBatchSize: 100,
          relatedTargetMaxBatches: 10,
          relatedTargetMaxAttempts: 3,
        }),
        getOpenAlexConfig: jest.fn(),
      },
      { fetchRelatedWorksByIds } as never,
      {
        backfillRelatedWorkSyncEligibility: jest.fn(),
        listRelatedWorkSyncRootIds: jest.fn().mockResolvedValue(['W1']),
        replaceRelatedWorkSnapshots,
      } as never,
    );

    await expect(useCase.execute()).resolves.toEqual({
      batches: 1,
      rootsSelected: 1,
      rootsSynced: 1,
    });
    expect(fetchRelatedWorksByIds).toHaveBeenCalledWith(
      expect.objectContaining({ ids: ['W1'] }),
    );
    expect(replaceRelatedWorkSnapshots).toHaveBeenCalledWith([
      {
        sourceId: 'W1',
        workType: 'article',
        references: [
          { id: 'W2', rank: 1 },
          { id: 'W3', rank: 3 },
        ],
      },
    ]);
  });
});
