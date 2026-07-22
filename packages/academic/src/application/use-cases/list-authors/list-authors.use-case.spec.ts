import { createAcademicGraphRepositoryDouble } from '@repo/academic/application/use-cases/testing';
import { ListAuthorsUseCase } from '@repo/academic/application/use-cases/list-authors/list-authors.use-case';
import { AuthorListItem } from '@repo/academic/domain/academic-graph.model';

describe('ListAuthorsUseCase', () => {
  it('lists authors with cursor pagination', async () => {
    const author: AuthorListItem = {
      id: 'author-1',
      displayName: 'Ada Lovelace',
      articleCount: 3,
    };
    const listAuthors = jest.fn().mockResolvedValue({
      items: [author],
      nextCursor: 'author-1',
    });
    const repository = createAcademicGraphRepositoryDouble({
      listAuthors,
    });
    const useCase = new ListAuthorsUseCase(repository);

    await expect(useCase.execute({ cursor: null, limit: 10 })).resolves.toEqual(
      {
        items: [author],
        nextCursor: 'author-1',
      },
    );
    expect(listAuthors).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
    });
  });
});
