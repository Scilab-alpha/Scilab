import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  ListJournalsInput,
  ListJournalsOutput,
} from '@/academic/application/use-cases/list-journals/list-journals.dto';

export class ListJournalsUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: ListJournalsInput): Promise<ListJournalsOutput> {
    return this.graphs.listJournals(input);
  }
}
