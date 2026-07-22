import { GetArticleByIdUseCase } from '@/academic/application/use-cases/get-article-by-id/get-article-by-id.use-case';
import { ArticleGraph } from '@/academic/domain/academic-graph.model';
import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';

describe('GetArticleByIdUseCase', () => {
  it('returns an article graph by id', async () => {
    const article: ArticleGraph = {
      article: {
        id: 'article-1',
        title: 'Academic detail',
      },
    };
    const getArticleById = jest.fn().mockResolvedValue(article);
    const repository = createAcademicGraphRepositoryDouble({ getArticleById });
    const useCase = new GetArticleByIdUseCase(repository);

    await expect(useCase.execute({ articleId: 'article-1' })).resolves.toBe(
      article,
    );
    expect(getArticleById).toHaveBeenCalledWith('article-1');
  });
});
