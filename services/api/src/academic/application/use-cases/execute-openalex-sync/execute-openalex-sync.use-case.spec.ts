import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';
import { ArticleGraph } from '@/academic/domain/academic-graph.model';
import { buildScimagoDataset } from '@/academic/domain/scimago.model';

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
                publication_year: 2025,
                primary_location: {
                  source: {
                    id: 'https://openalex.org/S123',
                    issn: ['1542-4863'],
                  },
                },
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
      { load: () => Promise.resolve(buildScimagoDataset([])) },
      {
        upsertScimagoTaxonomy: () => Promise.resolve(),
        upsertScimagoJournalRanking: () => Promise.resolve(0),
      },
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      syncLogId: 'sync-log-id',
      totalFetched: 1,
      totalInserted: 1,
      rankingUnmatched: 1,
      status: 'SUCCESS',
    });
    expect(upsertedGraphs[0]?.article).toMatchObject({
      id: 'W123',
      title: 'Fetched work',
    });
    expect(completedLogs).toHaveLength(1);
  });

  it('upserts one ranking for repeated work records from the same journal and year', async () => {
    const upsertScimagoJournalRanking = jest.fn().mockResolvedValue(5);
    const record = {
      year: 2025,
      sourceId: 'scimago-source',
      title: 'Journal',
      issns: ['1542-4863'],
      sjr: 1.2,
      hIndex: 10,
      rank: 1,
      bestQuartile: 'Q1',
      categories: [],
      areas: [],
    };
    const work = {
      id: 'https://openalex.org/W123',
      display_name: 'Fetched work',
      publication_year: 2025,
      primary_location: {
        source: { id: 'https://openalex.org/S123', issn: ['1542-4863'] },
      },
    };
    const useCase = new ExecuteOpenAlexSyncUseCase(
      {
        getSyncConfig: () => ({
          apiKey: 'test-key',
          baseUrl: 'https://api.openalex.org',
          perPage: 2,
        }),
      },
      {
        fetchWorks: () =>
          Promise.resolve({
            results: [work, { ...work, id: 'https://openalex.org/W124' }],
          }),
        fetchWorksByIds: jest.fn(),
      },
      createAcademicGraphRepositoryDouble(),
      {
        startOpenAlexScheduledSync: () => Promise.resolve('sync-log-id'),
        completeOpenAlexSync: () => Promise.resolve(),
        failOpenAlexSync: () => Promise.resolve(),
      },
      { load: () => Promise.resolve(buildScimagoDataset([record])) },
      {
        upsertScimagoTaxonomy: () => Promise.resolve(),
        upsertScimagoJournalRanking,
      },
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      rankingMatched: 1,
      rankingRowsUpserted: 5,
      status: 'SUCCESS',
    });
    expect(upsertScimagoJournalRanking).toHaveBeenCalledTimes(1);
  });
});
