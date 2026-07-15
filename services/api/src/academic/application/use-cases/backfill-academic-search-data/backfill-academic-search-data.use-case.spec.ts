import { BackfillAcademicSearchDataUseCase } from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.use-case';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';

describe('BackfillAcademicSearchDataUseCase', () => {
  it('normalizes publishers and backfills citation counts in bounded batches', async () => {
    const updatePublisherNameNormalizations = jest
      .fn()
      .mockResolvedValue(undefined);
    const updateArticleCitationCounts = jest.fn().mockResolvedValue(undefined);
    const repository = createAcademicGraphRepositoryDouble({
      listJournalsForPublisherNormalization: jest.fn().mockResolvedValueOnce({
        items: [{ id: 'journal-1', publisherName: '  SciLab   Press ' }],
        nextCursor: null,
      }),
      updatePublisherNameNormalizations,
      listHydratedArticleIdsMissingCitation: jest.fn().mockResolvedValueOnce({
        items: ['W1', 'W2'],
        nextCursor: null,
      }),
      updateArticleCitationCounts,
    });
    const fetchWorksByIds = jest.fn().mockResolvedValue({
      results: [
        { id: 'https://openalex.org/W1', cited_by_count: 12 },
        { id: 'https://openalex.org/W2', cited_by_count: 0 },
      ],
    });
    const useCase = new BackfillAcademicSearchDataUseCase(
      {
        getOpenAlexConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
        }),
      },
      { fetchWorks: jest.fn(), fetchWorksByIds },
      repository,
    );

    await expect(useCase.execute({ batchSize: 500 })).resolves.toEqual({
      publishersNormalized: 1,
      citationsUpdated: 2,
      unmatchedArticleIds: [],
    });
    expect(updatePublisherNameNormalizations).toHaveBeenCalledWith([
      { id: 'journal-1', normalizedName: 'scilab press' },
    ]);
    expect(fetchWorksByIds).toHaveBeenCalledWith(
      expect.objectContaining({ ids: ['W1', 'W2'] }),
    );
    expect(updateArticleCitationCounts).toHaveBeenCalledWith([
      { id: 'W1', citationCount: 12 },
      { id: 'W2', citationCount: 0 },
    ]);
  });

  it('reports ids that OpenAlex does not return', async () => {
    const repository = createAcademicGraphRepositoryDouble({
      listHydratedArticleIdsMissingCitation: jest.fn().mockResolvedValue({
        items: ['W404'],
        nextCursor: null,
      }),
    });
    const useCase = new BackfillAcademicSearchDataUseCase(
      {
        getOpenAlexConfig: () => ({
          apiKey: 'key',
          baseUrl: 'https://api.openalex.org',
        }),
      },
      {
        fetchWorks: jest.fn(),
        fetchWorksByIds: jest.fn().mockResolvedValue({ results: [] }),
      },
      repository,
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      citationsUpdated: 0,
      unmatchedArticleIds: ['W404'],
    });
  });
});
