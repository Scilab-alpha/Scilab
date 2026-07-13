import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';
import { ArticleGraph } from '@/academic/domain/academic-graph.model';

describe('ExecuteOpenAlexSyncUseCase', () => {
  it('fetches, transforms, persists graphs, and completes sync log', async () => {
    const upsertedGraphs: ArticleGraph[] = [];
    const completedLogs: unknown[] = [];
    const useCase = new ExecuteOpenAlexSyncUseCase(
      {
        getSyncConfig: () => ({
          apiKey: 'test-key',
          baseUrl: 'https://api.openalex.org',
          perPage: 1,
        }),
      },
      {
        fetchWorks: () =>
          Promise.resolve({
            results: [
              {
                id: 'https://openalex.org/W123',
                display_name: 'Fetched work',
              },
            ],
          }),
        fetchWorksByIds: jest.fn(),
      },
      createAcademicGraphRepositoryDouble({
        ensureSchema: () => Promise.resolve(),
        upsertArticleGraph: (graph) => {
          upsertedGraphs.push(graph);
          return Promise.resolve();
        },
      }),
      {
        startOpenAlexScheduledSync: () => Promise.resolve('sync-log-id'),
        completeOpenAlexSync: (_syncLogId, input) => {
          completedLogs.push(input);
          return Promise.resolve();
        },
        failOpenAlexSync: () => Promise.resolve(),
      },
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      syncLogId: 'sync-log-id',
      totalFetched: 1,
      totalInserted: 1,
      status: 'SUCCESS',
    });
    expect(upsertedGraphs[0]?.article).toMatchObject({
      id: 'W123',
      title: 'Fetched work',
    });
    expect(completedLogs).toHaveLength(1);
  });
});
