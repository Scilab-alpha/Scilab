import { GetJournalByIdUseCase } from '@repo/academic/application/use-cases/get-journal-by-id/get-journal-by-id.use-case';
import { JournalListItem } from '@repo/academic/domain/academic-graph.model';
import { createAcademicGraphRepositoryDouble } from '@repo/academic/application/use-cases/testing';

describe('GetJournalByIdUseCase', () => {
  it('returns a journal by id', async () => {
    const journal: JournalListItem = {
      id: 'journal-1',
      displayName: 'Journal Detail',
      articleCount: 2,
    };
    const getJournalById = jest.fn().mockResolvedValue(journal);
    const repository = createAcademicGraphRepositoryDouble({ getJournalById });
    const useCase = new GetJournalByIdUseCase(repository);

    await expect(useCase.execute({ journalId: 'journal-1' })).resolves.toBe(
      journal,
    );
    expect(getJournalById).toHaveBeenCalledWith('journal-1');
  });
});
