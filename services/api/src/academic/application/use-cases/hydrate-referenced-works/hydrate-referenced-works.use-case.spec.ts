import { HydrateReferencedWorksUseCase } from '@/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.use-case';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';

describe('HydrateReferencedWorksUseCase', () => {
  it('hydrates at most the selected placeholders without expanding reference depth', async () => {
    const upsertArticleGraph = jest.fn().mockResolvedValue(undefined);
    const useCase = new HydrateReferencedWorksUseCase(
      {
        getOpenAlexConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
        }),
      },
      {
        fetchWorks: jest.fn(),
        fetchWorksByIds: jest.fn(),
        fetchWorkDetailsByIds: jest.fn().mockResolvedValue({
          results: [
            {
              id: 'https://openalex.org/W1',
              display_name: 'Reference work',
              referenced_works: ['https://openalex.org/W2'],
            },
          ],
        }),
      },
      createAcademicGraphRepositoryDouble({
        listPlaceholderArticleIds: jest.fn().mockResolvedValue(['W1']),
        upsertArticleGraph,
      }),
    );

    await expect(useCase.execute()).resolves.toEqual({
      requested: 1,
      hydrated: 1,
    });
    expect(upsertArticleGraph).toHaveBeenCalledWith(
      expect.objectContaining({ citedArticleIds: [] }),
    );
  });
});
