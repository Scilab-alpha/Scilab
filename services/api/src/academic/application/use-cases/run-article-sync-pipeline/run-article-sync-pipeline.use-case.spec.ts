import { RunArticleSyncPipelineUseCase } from '@/academic/application/use-cases/run-article-sync-pipeline/run-article-sync-pipeline.use-case';

describe('RunArticleSyncPipelineUseCase', () => {
  it('continues initial backfill with its persisted cursor and completes it when OpenAlex has no next cursor', async () => {
    const saveArticleSyncCheckpoint = jest.fn().mockResolvedValue(undefined);
    const execute = jest.fn().mockResolvedValue({
      nextCursor: null,
      status: 'SUCCESS',
    });
    const useCase = new RunArticleSyncPipelineUseCase(
      {
        getSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
          perPage: 100,
        }),
      },
      {
        getArticleSyncCheckpoint: jest.fn().mockResolvedValue({
          cursor: 'cursor-1',
          initialBackfillComplete: false,
          lastSuccessfulAt: null,
        }),
        saveArticleSyncCheckpoint,
      },
      { execute } as never,
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      initialBackfillComplete: true,
    });
    expect(execute).toHaveBeenCalledWith({ cursor: 'cursor-1', maxPages: 10 });
    expect(saveArticleSyncCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: null,
        initialBackfillComplete: true,
      }),
    );
  });

  it('runs created-date delta and recent publication refresh after initial backfill', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ nextCursor: null, status: 'SUCCESS' });
    const useCase = new RunArticleSyncPipelineUseCase(
      {
        getSyncConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
          perPage: 100,
          filter: 'type:article',
        }),
      },
      {
        getArticleSyncCheckpoint: jest.fn().mockResolvedValue({
          cursor: null,
          initialBackfillComplete: true,
          lastSuccessfulAt: new Date('2026-07-14T00:00:00.000Z'),
        }),
        saveArticleSyncCheckpoint: jest.fn().mockResolvedValue(undefined),
      },
      { execute } as never,
    );

    await useCase.execute();

    expect(execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filter: 'type:article,from_created_date:2026-07-13',
      }),
    );
    expect(execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        filter: expect.stringMatching(
          /^type:article,from_publication_date:\d{4}-\d{2}-\d{2}$/,
        ),
      }),
    );
  });
});
