import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  ListArticlesInput,
  ListArticlesOutput,
} from '@repo/academic/application/use-cases/list-articles/list-articles.dto';

export class ListArticlesUseCase {
  constructor(private readonly graphs: AcademicGraphRepository) {}

  execute(input: ListArticlesInput): Promise<ListArticlesOutput> {
    return this.graphs.listArticles(input);
  }
}
