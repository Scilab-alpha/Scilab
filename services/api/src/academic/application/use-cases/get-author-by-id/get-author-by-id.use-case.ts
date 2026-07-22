import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  GetAuthorByIdInput,
  GetAuthorByIdOutput,
} from '@/academic/application/use-cases/get-author-by-id/get-author-by-id.dto';

export class GetAuthorByIdUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: GetAuthorByIdInput): Promise<GetAuthorByIdOutput> {
    return this.graphs.getAuthorById(input.authorId);
  }
}
