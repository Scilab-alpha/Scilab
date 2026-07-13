import {
  ArticleGraph,
  ArticleNode,
  AuthorNode,
  JournalNode,
  KeywordNode,
  TopicNode,
} from '@/academic/domain/academic-graph.model';

export interface ArticleGraphOutput {
  id: string;
  title: string;
  abstract: string | null;
  doi: string | null;
  publicationYear: number | null;
  version: string | null;
  volumeNumber: number | string | null;
  issueNumber: string | null;
  citationCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  journal: JournalOutput | null;
  authors: AuthorOutput[];
  keywords: KeywordOutput[];
  topics: TopicOutput[];
  citedArticleIds: string[];
}

interface JournalOutput {
  id: string;
  sourceId: string | null;
  displayName: string | null;
  type: string | null;
  isOpenAccess: boolean | null;
  isOaDiamond: boolean | null;
  coverage: string | null;
  country: string | null;
  issnList: string[] | null;
  publisherName: string | null;
  publisherImageUrl: string | null;
  subjectCategories: string[] | null;
}

interface AuthorOutput {
  id: string;
  orcid: string | null;
  displayName: string | null;
  imageUrl: string | null;
  authorPosition: number | null;
}

interface KeywordOutput {
  id: string;
  displayName: string | null;
  score: number | null;
}

interface TopicOutput {
  id: string;
  displayName: string | null;
  score: number | null;
  isPrimary: boolean | null;
}

export function toArticleGraphOutput(graph: ArticleGraph): ArticleGraphOutput {
  return {
    ...toArticleOutput(graph.article),
    journal: graph.journal ? toJournalOutput(graph.journal) : null,
    authors: (graph.authors ?? []).map(toAuthorOutput),
    keywords: (graph.keywords ?? []).map(toKeywordOutput),
    topics: (graph.topics ?? []).map(toTopicOutput),
    citedArticleIds: graph.citedArticleIds ?? [],
  };
}

function toArticleOutput(article: ArticleNode) {
  return {
    id: article.id,
    title: article.title,
    abstract: article.abstract ?? null,
    doi: article.doi ?? null,
    publicationYear: article.publicationYear ?? null,
    version: article.version ?? null,
    volumeNumber: article.volumeNumber ?? null,
    issueNumber: article.issueNumber ?? null,
    citationCount: article.citationCount ?? null,
    createdAt: toIsoString(article.createdAt),
    updatedAt: toIsoString(article.updatedAt),
  };
}

function toJournalOutput(journal: JournalNode): JournalOutput {
  return {
    id: journal.id,
    sourceId: journal.sourceId ?? null,
    displayName: journal.displayName ?? null,
    type: journal.type ?? null,
    isOpenAccess: journal.isOpenAccess ?? null,
    isOaDiamond: journal.isOaDiamond ?? null,
    coverage: journal.coverage ?? null,
    country: journal.country ?? null,
    issnList: journal.issnList ?? null,
    publisherName: journal.publisherName ?? null,
    publisherImageUrl: journal.publisherImageUrl ?? null,
    subjectCategories: journal.subjectCategories ?? null,
  };
}

function toAuthorOutput(author: AuthorNode): AuthorOutput {
  return {
    id: author.id,
    orcid: author.orcid ?? null,
    displayName: author.displayName ?? null,
    imageUrl: author.imageUrl ?? null,
    authorPosition: author.authorPosition ?? null,
  };
}

function toKeywordOutput(keyword: KeywordNode): KeywordOutput {
  return {
    id: keyword.id,
    displayName: keyword.displayName ?? null,
    score: keyword.score ?? null,
  };
}

function toTopicOutput(topic: TopicNode): TopicOutput {
  return {
    id: topic.id,
    displayName: topic.displayName ?? null,
    score: topic.score ?? null,
    isPrimary: topic.isPrimary ?? null,
  };
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}
