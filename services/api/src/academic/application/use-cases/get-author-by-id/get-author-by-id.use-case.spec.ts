import { createAcademicGraphRepositoryDouble } from '@/academic/application/use-cases/testing';
import { GetAuthorByIdUseCase } from '@/academic/application/use-cases/get-author-by-id/get-author-by-id.use-case';
import { AuthorListItem } from '@/academic/domain/academic-graph.model';

describe('GetAuthorByIdUseCase', () => {
  it('returns an author by id', async () => {
    const author: AuthorListItem = {
      id: 'author-1',
      displayName: 'Ada Lovelace',
      articleCount: 3,
    };
    const getAuthorById = jest.fn().mockResolvedValue(author);
    const repository = createAcademicGraphRepositoryDouble({
      getAuthorById,
    });
    const useCase = new GetAuthorByIdUseCase(repository);

    await expect(useCase.execute({ authorId: 'author-1' })).resolves.toEqual(
      author,
    );
    expect(getAuthorById).toHaveBeenCalledWith('author-1');
  });
});
