import {
  AcademicPipelineJobRunner,
  JournalArticleSyncProcessor,
} from './academic-pipeline.processor';

describe('JournalArticleSyncProcessor', () => {
  it('maps the journal article queue to its sync use case', async () => {
    const execute = jest.fn().mockResolvedValue({
      pagesFetched: 2,
      articlesInserted: 3,
      articlesUpdated: 4,
    });
    const run = jest.fn(async (_context, _job, task: () => Promise<unknown>) =>
      task(),
    );
    const processor = new JournalArticleSyncProcessor(
      { run } as never,
      { execute } as never,
    );

    await processor.process({} as never);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(
      { source: 'OPENALEX', type: 'JOURNAL_ARTICLE_SYNC' },
      expect.any(Object),
      expect.any(Function),
      expect.any(Function),
    );
  });
});

describe('AcademicPipelineJobRunner', () => {
  it('creates a durable run for a legacy queue payload before it starts work', async () => {
    const upsert = jest.fn().mockResolvedValue({ id: 'legacy-run' });
    const update = jest.fn().mockResolvedValue(undefined);
    const startPipelineJob = jest.fn().mockResolvedValue('sync-log-1');
    const completePipelineJob = jest.fn().mockResolvedValue(undefined);
    const runner = new AcademicPipelineJobRunner(
      { startPipelineJob, completePipelineJob } as never,
      {
        getOpenAlexConfig: () => ({ baseUrl: 'https://api.openalex.org' }),
      } as never,
      {
        getSemanticScholarSupplementConfig: () => ({
          baseUrl: 'https://api.semanticscholar.org',
        }),
      } as never,
      {
        academicJobRun: { upsert, update, findUnique: jest.fn() },
      } as never,
    );
    const job = {
      id: 'legacy-bull-job',
      data: { scheduledAt: '2026-07-21T00:00:00.000Z' },
      opts: { attempts: 1 },
      attemptsMade: 0,
      updateProgress: jest.fn().mockResolvedValue(undefined),
    };

    await runner.run(
      { source: 'OPENALEX', type: 'JOURNAL_ARTICLE_SYNC' },
      job as never,
      async () => ({ fetched: 3 }),
      (result) => ({ fetched: result.fetched, inserted: 0, updated: 0 }),
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bullJobId: 'legacy-bull-job' },
        create: expect.objectContaining({
          jobId: 'journal-article-sync',
          status: 'RUNNING',
        }),
      }),
    );
    expect(startPipelineJob).toHaveBeenCalledWith(
      expect.objectContaining({ jobRunId: 'legacy-run' }),
    );
  });
});
