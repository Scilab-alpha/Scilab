import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  ListAuthorsInput,
  ListAuthorsOutput,
} from '@/academic/application/use-cases/list-authors/list-authors.dto';

export class ListAuthorsUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: ListAuthorsInput): Promise<ListAuthorsOutput> {
    return this.graphs.listAuthors(input);
  }
}
