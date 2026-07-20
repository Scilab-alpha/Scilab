import { ListJournalsUseCase } from '@repo/academic/application/use-cases/list-journals/list-journals.use-case';
import { JournalListItem } from '@repo/academic/domain/academic-graph.model';
import { createAcademicGraphRepositoryDouble } from '@repo/academic/application/use-cases/testing';

describe('ListJournalsUseCase', () => {
  it('lists journals with cursor pagination', async () => {
    const journal: JournalListItem = {
      id: 'journal-1',
      displayName: 'Journal of Cursor APIs',
      articleCount: 3,
    };
    const listJournals = jest.fn().mockResolvedValue({
      items: [journal],
      nextCursor: 'journal-1',
    });
    const repository = createAcademicGraphRepositoryDouble({
      listJournals,
    });
    const useCase = new ListJournalsUseCase(repository);

    await expect(useCase.execute({ cursor: null, limit: 10 })).resolves.toEqual(
      {
        items: [journal],
        nextCursor: 'journal-1',
      },
    );
    expect(listJournals).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
    });
  });
});
