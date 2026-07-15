import { JournalArticleSyncProcessor } from './academic-pipeline.processor';

describe('JournalArticleSyncProcessor', () => {
  it('maps the journal article queue to its sync use case', async () => {
    const execute = jest.fn().mockResolvedValue({
      pagesFetched: 2,
      articlesInserted: 3,
      articlesUpdated: 4,
    });
    const run = jest.fn(async (_context, task: () => Promise<unknown>) =>
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
      expect.any(Function),
      expect.any(Function),
    );
  });
});
