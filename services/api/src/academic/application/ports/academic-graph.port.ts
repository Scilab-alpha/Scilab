import {
  AcademicNodeType,
  ArticleGraph,
} from '@/academic/domain/academic-graph.model';

export const ACADEMIC_GRAPH_REPOSITORY = Symbol('ACADEMIC_GRAPH_REPOSITORY');

export interface AcademicGraphRepository {
  ensureSchema(): Promise<void>;
  upsertArticleGraph(graph: ArticleGraph): Promise<void>;
  findArticlesByIds(ids: string[]): Promise<ArticleGraph[]>;
  findExistingReferenceIds(
    type: AcademicNodeType,
    ids: string[],
  ): Promise<Set<string>>;
}
