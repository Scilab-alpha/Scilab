import { HydrateRelatedWorksUseCase } from './hydrate-related-works.use-case';
import { ArticleGraph } from '@repo/academic/domain/academic-graph.model';

describe('HydrateRelatedWorksUseCase', () => {
  it('hydrates only articles without recursively capturing related works and retries missing ids', async () => {
    const upsertArticleGraphs = jest
      .fn<Promise<{ inserted: number; updated: number }>, [ArticleGraph[]]>()
      .mockResolvedValue({ inserted: 1, updated: 0 });
    const activatePendingRelatedWorkTargets = jest.fn();
    const discardPendingRelatedWorkTargets = jest.fn();
    const incrementPendingRelatedWorkAttempts = jest.fn();
    const useCase = new HydrateRelatedWorksUseCase(
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
          relatedRootBatchSize: 100,
          relatedRootMaxBatches: 10,
          relatedTargetBatchSize: 3,
          relatedTargetMaxBatches: 1,
          relatedTargetMaxAttempts: 3,
        }),
        getOpenAlexConfig: jest.fn(),
      },
      {
        fetchWorkDetailsByIds: jest.fn().mockResolvedValue({
          results: [
            {
              id: 'https://openalex.org/W1',
              type: 'article',
              display_name: 'Related article',
              related_works: ['https://openalex.org/W9'],
            },
            { id: 'https://openalex.org/W2', type: 'book' },
          ],
        }),
      } as never,
      {
        listPendingRelatedWorkTargetIds: jest
          .fn()
          .mockResolvedValue(['W1', 'W2', 'W3']),
        upsertArticleGraphs,
        activatePendingRelatedWorkTargets,
        discardPendingRelatedWorkTargets,
        incrementPendingRelatedWorkAttempts,
      } as never,
    );

    await expect(useCase.execute()).resolves.toEqual({
      requested: 3,
      hydrated: 1,
      discarded: 1,
    });
    const hydratedGraph = upsertArticleGraphs.mock.calls[0]?.[0][0];
    expect(hydratedGraph?.article.id).toBe('W1');
    expect(hydratedGraph?.relatedWorkReferences).toBeUndefined();
    expect(activatePendingRelatedWorkTargets).toHaveBeenCalledWith(['W1']);
    expect(discardPendingRelatedWorkTargets).toHaveBeenCalledWith(['W2']);
    expect(incrementPendingRelatedWorkAttempts).toHaveBeenCalledWith(['W3'], 3);
  });
});
