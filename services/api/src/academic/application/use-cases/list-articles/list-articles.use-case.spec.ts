import { ListArticlesUseCase } from '@/academic/application/use-cases/list-articles/list-articles.use-case';
import { ArticleGraph } from '@/academic/domain/academic-graph.model';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';

describe('ListArticlesUseCase', () => {
  it('lists articles with cursor pagination', async () => {
    const article: ArticleGraph = {
      article: {
        id: 'article-1',
        title: 'Cursor pagination for academic search',
      },
    };
    const listArticles = jest.fn().mockResolvedValue({
      items: [article],
      nextCursor: 'article-1',
    });
    const repository = createAcademicGraphRepositoryDouble({
      listArticles,
    });
    const useCase = new ListArticlesUseCase(repository);

    await expect(
      useCase.execute({ cursor: 'article-0', limit: 1 }),
    ).resolves.toEqual({
      items: [article],
      nextCursor: 'article-1',
    });
    expect(listArticles).toHaveBeenCalledWith({
      cursor: 'article-0',
      limit: 1,
    });
  });
});
