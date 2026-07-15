import { CrawlOutgoingReferencesUseCase } from './crawl-outgoing-references.use-case';

describe('CrawlOutgoingReferencesUseCase', () => {
  it('creates references only in the dedicated outgoing-reference job', async () => {
    const upsertArticleGraphs = jest
      .fn()
      .mockResolvedValue({ inserted: 0, updated: 1 });
    const markOutgoingReferencesCrawled = jest.fn();
    const useCase = new CrawlOutgoingReferencesUseCase(
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
        fetchWorks: jest.fn(),
        fetchWorksByIds: jest.fn(),
        fetchWorkDetailsByIds: jest.fn().mockResolvedValue({
          results: [{ id: 'W1', title: 'Article', referenced_works: ['W2'] }],
        }),
      },
      {
        listHydratedArticleIdsMissingOutgoingReferences: jest
          .fn()
          .mockResolvedValue(['W1']),
        upsertArticleGraphs,
        markOutgoingReferencesCrawled,
      } as never,
    );

    await expect(useCase.execute()).resolves.toEqual({
      articlesSelected: 1,
      articlesHydrated: 1,
      edgesPrepared: 1,
    });
    expect(upsertArticleGraphs).toHaveBeenCalledWith([
      expect.objectContaining({ citedArticleIds: ['W2'] }),
    ]);
    expect(markOutgoingReferencesCrawled).toHaveBeenCalledWith(['W1']);
  });
});
