import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  GetJournalByIdInput,
  GetJournalByIdOutput,
} from '@repo/academic/application/use-cases/get-journal-by-id/get-journal-by-id.dto';

export class GetJournalByIdUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: GetJournalByIdInput): Promise<GetJournalByIdOutput> {
    return this.graphs.getJournalById(input.journalId);
  }
}
