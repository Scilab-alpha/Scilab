import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  GetArticleByIdInput,
  GetArticleByIdOutput,
} from '@/academic/application/use-cases/get-article-by-id/get-article-by-id.dto';

export class GetArticleByIdUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: GetArticleByIdInput): Promise<GetArticleByIdOutput> {
    return this.graphs.getArticleById(input.articleId);
  }
}
