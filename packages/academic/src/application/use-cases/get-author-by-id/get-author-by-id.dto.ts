import { AuthorListItem } from '@repo/academic/domain/academic-graph.model';

export interface GetAuthorByIdInput {
  authorId: string;
}

export type GetAuthorByIdOutput = AuthorListItem | null;
