import { GetArticleGraphUseCase } from './get-article-graph.use-case';

describe('GetArticleGraphUseCase', () => {
  const getArticleGraph = jest.fn();
  const useCase = new GetArticleGraphUseCase({ getArticleGraph });

  beforeEach(() => {
    getArticleGraph.mockReset();
  });

  it('returns related edges in their stored direction and virtual deduplicated year nodes', async () => {
    getArticleGraph.mockResolvedValue({
      root: { id: 'W1', title: 'Root article', publicationYear: 2024 },
      neighbors: [
        {
          id: 'W2',
          title: 'Outgoing paper',
          publicationYear: 2024,
          rank: 1,
          tier: 0,
        },
        {
          id: 'W3',
          title: 'Incoming paper',
          publicationYear: null,
          rank: 2,
          tier: 1,
        },
      ],
      edges: [
        { sourceArticleId: 'W1', targetArticleId: 'W2' },
        { sourceArticleId: 'W2', targetArticleId: 'W1' },
        { sourceArticleId: 'W3', targetArticleId: 'W2' },
      ],
    });

    await expect(
      useCase.execute({ articleId: 'W1', cursor: null, limit: 20 }),
    ).resolves.toEqual({
      nodes: [
        { id: 'article:W1', type: 'article', label: 'Root article' },
        { id: 'article:W2', type: 'article', label: 'Outgoing paper' },
        { id: 'article:W3', type: 'article', label: 'Incoming paper' },
        { id: 'year:2024', type: 'year', label: '2024' },
      ],
      edges: [
        {
          id: 'article:W1->article:W2',
          sourceId: 'article:W1',
          targetId: 'article:W2',
          type: 'RELATED_TO',
        },
        {
          id: 'article:W1->year:2024',
          sourceId: 'article:W1',
          targetId: 'year:2024',
          type: 'PUBLISHED_IN_YEAR',
        },
        {
          id: 'article:W2->article:W1',
          sourceId: 'article:W2',
          targetId: 'article:W1',
          type: 'RELATED_TO',
        },
        {
          id: 'article:W2->year:2024',
          sourceId: 'article:W2',
          targetId: 'year:2024',
          type: 'PUBLISHED_IN_YEAR',
        },
        {
          id: 'article:W3->article:W2',
          sourceId: 'article:W3',
          targetId: 'article:W2',
          type: 'RELATED_TO',
        },
      ],
      truncated: false,
      nextCursor: null,
    });
  });

  it('returns an opaque cursor for the final selected neighbor and rejects a cursor for another root', async () => {
    getArticleGraph.mockResolvedValue({
      root: { id: 'W1', title: 'Root article', publicationYear: null },
      neighbors: [
        { id: 'W2', title: 'First', publicationYear: null, rank: 1, tier: 0 },
        { id: 'W3', title: 'Second', publicationYear: null, rank: 2, tier: 0 },
      ],
      edges: [],
    });

    const result = await useCase.execute({
      articleId: 'W1',
      cursor: null,
      limit: 1,
    });
    expect(result.truncated).toBe(true);
    expect(typeof result.nextCursor).toBe('string');
    const cursor = result.nextCursor;
    if (!cursor) {
      throw new Error('Expected the graph page to return a cursor');
    }
    await expect(
      useCase.execute({ articleId: 'W9', cursor, limit: 1 }),
    ).rejects.toThrow('cursor is invalid for this article graph');
  });
});
