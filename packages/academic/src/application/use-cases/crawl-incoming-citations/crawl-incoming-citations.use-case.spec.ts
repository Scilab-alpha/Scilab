import { CrawlIncomingCitationsUseCase } from '@repo/academic/application/use-cases/crawl-incoming-citations/crawl-incoming-citations.use-case';
import { createAcademicGraphRepositoryDouble } from '@repo/academic/application/use-cases/testing';

describe('CrawlIncomingCitationsUseCase', () => {
  it('stores incoming works with the citing-to-target CITES direction', async () => {
    const upsertArticleGraph = jest.fn().mockResolvedValue(undefined);
    const markIncomingCitationCrawled = jest.fn().mockResolvedValue(undefined);
    const fetchCitingWorks = jest.fn().mockResolvedValue({
      results: [{ id: 'https://openalex.org/W2', display_name: 'Citing work' }],
    });
    const useCase = new CrawlIncomingCitationsUseCase(
      {
        getOpenAlexConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
        }),
      },
      {
        fetchWorks: jest.fn(),
        fetchWorksByIds: jest.fn(),
        fetchCitingWorks,
      },
      createAcademicGraphRepositoryDouble({
        listHydratedArticleIdsForIncomingCitation: jest
          .fn()
          .mockResolvedValue(['W1']),
        upsertArticleGraph,
        markIncomingCitationCrawled,
      }),
    );

    await expect(
      useCase.execute(new Date('2026-07-15T04:00:00.000Z')),
    ).resolves.toEqual({
      targets: 1,
      citingWorks: 1,
    });
    expect(fetchCitingWorks).toHaveBeenCalledWith(
      expect.objectContaining({ workId: 'W1', limit: 100 }),
    );
    expect(upsertArticleGraph).toHaveBeenCalledWith(
      expect.objectContaining({ citedArticleIds: ['W1'] }),
    );
    expect(markIncomingCitationCrawled).toHaveBeenCalledWith(['W1']);
  });
});
