import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  AcademicNodeType,
  ArticleGraph,
  ArticleNode,
  CursorPage,
  CursorPaginationInput,
  AuthorNode,
  JournalListItem,
  JournalNode,
  KeywordNode,
  TopicNode,
} from '@/academic/domain/academic-graph.model';
import { Neo4jService } from '@/neo4j/neo4j.service';
import { ACADEMIC_GRAPH_SCHEMA_CYPHER } from './academic-graph-schema.cypher';

type Neo4jArticleGraph = ArticleGraph;
type Neo4jJournalListItem = JournalListItem;

@Injectable()
export class Neo4jAcademicGraphRepository implements AcademicGraphRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async ensureSchema(): Promise<void> {
    for (const cypher of ACADEMIC_GRAPH_SCHEMA_CYPHER) {
      await this.neo4j.executeWrite(cypher);
    }
  }

  async upsertArticleGraph(graph: ArticleGraph): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MERGE (article:Article {id: $article.id})
      SET article.title = $article.title,
          article.abstract = $article.abstract,
          article.doi = $article.doi,
          article.publication_year = $article.publication_year,
          article.version = $article.version,
          article.volume_number = $article.volume_number,
          article.issue_number = $article.issue_number,
          article.created_at = coalesce($article.created_at, article.created_at, datetime()),
          article.updated_at = coalesce($article.updated_at, datetime())

      WITH article
      CALL {
        WITH article
        WITH article WHERE $journal IS NOT NULL
        MERGE (journal:Journal {id: $journal.id})
        SET journal.source_id = $journal.source_id,
            journal.display_name = $journal.display_name,
            journal.type = $journal.type,
            journal.is_open_access = $journal.is_open_access,
            journal.is_oa_diamond = $journal.is_oa_diamond,
            journal.coverage = $journal.coverage,
            journal.country = $journal.country,
            journal.region = $journal.region,
            journal.issn_list = $journal.issn_list,
            journal.publisher_name = $journal.publisher_name,
            journal.publisher_image_url = $journal.publisher_image_url,
            journal.subject_categories = $journal.subject_categories
        MERGE (article)-[:PUBLISHED_IN]->(journal)
        RETURN count(journal) AS journal_count
      }

      WITH article
      CALL {
        WITH article
        UNWIND $authors AS author_input
        MERGE (author:Author {id: author_input.id})
        SET author.orcid = author_input.orcid,
            author.display_name = author_input.display_name,
            author.url_image = author_input.url_image
        MERGE (author)-[wrote:WROTE]->(article)
        SET wrote.author_position = author_input.author_position
        RETURN count(author) AS author_count
      }

      WITH article
      CALL {
        WITH article
        UNWIND $keywords AS keyword_input
        MERGE (keyword:Keyword {id: keyword_input.id})
        SET keyword.display_name = keyword_input.display_name
        MERGE (article)-[has_keyword:HAS_KEYWORD]->(keyword)
        SET has_keyword.score = keyword_input.score
        RETURN count(keyword) AS keyword_count
      }

      WITH article
      CALL {
        WITH article
        UNWIND $topics AS topic_input
        MERGE (topic:Topic {id: topic_input.id})
        SET topic.display_name = topic_input.display_name,
            topic.score = topic_input.score
        MERGE (article)-[belongs_to:BELONGS_TO]->(topic)
        SET belongs_to.score = topic_input.score,
            belongs_to.is_primary = topic_input.is_primary
        RETURN count(topic) AS topic_count
      }

      WITH article
      CALL {
        WITH article
        UNWIND $cited_article_ids AS cited_article_id
        MERGE (cited:Article {id: cited_article_id})
        MERGE (article)-[:CITES]->(cited)
        RETURN count(cited) AS cited_count
      }

      RETURN article.id AS id
      `,
      {
        article: toNeo4jArticle(graph.article),
        journal: graph.journal ? toNeo4jJournal(graph.journal) : null,
        authors: (graph.authors ?? []).map(toNeo4jAuthor),
        keywords: (graph.keywords ?? []).map(toNeo4jKeyword),
        topics: (graph.topics ?? []).map(toNeo4jTopic),
        cited_article_ids: graph.citedArticleIds ?? [],
      },
    );
  }

  async listArticles(
    input: CursorPaginationInput,
  ): Promise<CursorPage<ArticleGraph>> {
    const limit = input.limit + 1;
    const result = await this.neo4j.executeRead<Neo4jArticleGraph>(
      `
      MATCH (article:Article)
      WHERE $cursor IS NULL OR article.id > $cursor
      WITH article
      ORDER BY article.id ASC
      LIMIT $limit
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal,
           collect(DISTINCT author {
             .id,
             .orcid,
             displayName: author.display_name,
             imageUrl: author.url_image,
             authorPosition: wrote.author_position
           }) AS author_rows
      OPTIONAL MATCH (article)-[has_keyword:HAS_KEYWORD]->(keyword:Keyword)
      WITH article, journal, author_rows,
           collect(DISTINCT keyword {
             .id,
             displayName: keyword.display_name,
             score: has_keyword.score
           }) AS keyword_rows
      OPTIONAL MATCH (article)-[belongs_to:BELONGS_TO]->(topic:Topic)
      WITH article, journal, author_rows, keyword_rows,
           collect(DISTINCT topic {
             .id,
             displayName: topic.display_name,
             score: belongs_to.score,
             isPrimary: belongs_to.is_primary
           }) AS topic_rows
      OPTIONAL MATCH (article)-[:CITES]->(cited:Article)
      WITH article, journal, author_rows, keyword_rows, topic_rows,
           collect(DISTINCT cited.id) AS cited_article_ids
      RETURN {
        article: article {
          .id,
          .title,
          .abstract,
          .doi,
          publicationYear: article.publication_year,
          .version,
          volumeNumber: article.volume_number,
          issueNumber: article.issue_number,
          createdAt: article.created_at,
          updatedAt: article.updated_at
        },
        journal: CASE
          WHEN journal IS NULL THEN NULL
          ELSE journal {
            .id,
            sourceId: journal.source_id,
            displayName: journal.display_name,
            .type,
            isOpenAccess: journal.is_open_access,
            isOaDiamond: journal.is_oa_diamond,
            .coverage,
            .country,
            .region,
            issnList: journal.issn_list,
            publisherName: journal.publisher_name,
            publisherImageUrl: journal.publisher_image_url,
            subjectCategories: journal.subject_categories
          }
        END,
        authors: [row IN author_rows WHERE row.id IS NOT NULL],
        keywords: [row IN keyword_rows WHERE row.id IS NOT NULL],
        topics: [row IN topic_rows WHERE row.id IS NOT NULL],
        citedArticleIds: cited_article_ids
      } AS graph
      `,
      { cursor: input.cursor ?? null, limit: neo4j.int(limit) },
      (record) => toPlain(record.get('graph')) as Neo4jArticleGraph,
    );

    return toCursorPage(
      result.records,
      input.limit,
      (graph) => graph.article.id,
    );
  }

  async getArticleById(id: string): Promise<ArticleGraph | null> {
    const [article] = await this.findArticlesByIds([id]);
    return article ?? null;
  }

  async listJournals(
    input: CursorPaginationInput,
  ): Promise<CursorPage<JournalListItem>> {
    const limit = input.limit + 1;
    const result = await this.neo4j.executeRead<Neo4jJournalListItem>(
      `
      MATCH (journal:Journal)
      WHERE $cursor IS NULL OR journal.id > $cursor
      WITH journal
      ORDER BY journal.id ASC
      LIMIT $limit
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, count(article) AS article_count
      RETURN journal {
        .id,
        sourceId: journal.source_id,
        displayName: journal.display_name,
        .type,
        isOpenAccess: journal.is_open_access,
        isOaDiamond: journal.is_oa_diamond,
        .coverage,
        .country,
        .region,
        issnList: journal.issn_list,
        publisherName: journal.publisher_name,
        publisherImageUrl: journal.publisher_image_url,
        subjectCategories: journal.subject_categories,
        articleCount: article_count
      } AS journal
      `,
      { cursor: input.cursor ?? null, limit: neo4j.int(limit) },
      (record) => toPlain(record.get('journal')) as Neo4jJournalListItem,
    );

    return toCursorPage(result.records, input.limit, (journal) => journal.id);
  }

  async getJournalById(id: string): Promise<JournalListItem | null> {
    const result = await this.neo4j.executeRead<Neo4jJournalListItem>(
      `
      MATCH (journal:Journal {id: $id})
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, count(article) AS article_count
      RETURN journal {
        .id,
        sourceId: journal.source_id,
        displayName: journal.display_name,
        .type,
        isOpenAccess: journal.is_open_access,
        isOaDiamond: journal.is_oa_diamond,
        .coverage,
        .country,
        .region,
        issnList: journal.issn_list,
        publisherName: journal.publisher_name,
        publisherImageUrl: journal.publisher_image_url,
        subjectCategories: journal.subject_categories,
        articleCount: article_count
      } AS journal
      `,
      { id },
      (record) => toPlain(record.get('journal')) as Neo4jJournalListItem,
    );

    return result.records[0] ?? null;
  }

  async findArticlesByIds(ids: string[]): Promise<ArticleGraph[]> {
    if (ids.length === 0) {
      return [];
    }

    const result = await this.neo4j.executeRead<Neo4jArticleGraph>(
      `
      MATCH (article:Article)
      WHERE article.id IN $ids
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal,
           collect(DISTINCT author {
             .id,
             .orcid,
             displayName: author.display_name,
             imageUrl: author.url_image,
             authorPosition: wrote.author_position
           }) AS author_rows
      OPTIONAL MATCH (article)-[has_keyword:HAS_KEYWORD]->(keyword:Keyword)
      WITH article, journal, author_rows,
           collect(DISTINCT keyword {
             .id,
             displayName: keyword.display_name,
             score: has_keyword.score
           }) AS keyword_rows
      OPTIONAL MATCH (article)-[belongs_to:BELONGS_TO]->(topic:Topic)
      WITH article, journal, author_rows, keyword_rows,
           collect(DISTINCT topic {
             .id,
             displayName: topic.display_name,
             score: belongs_to.score,
             isPrimary: belongs_to.is_primary
           }) AS topic_rows
      OPTIONAL MATCH (article)-[:CITES]->(cited:Article)
      WITH article, journal, author_rows, keyword_rows, topic_rows,
           collect(DISTINCT cited.id) AS cited_article_ids
      RETURN {
        article: article {
          .id,
          .title,
          .abstract,
          .doi,
          publicationYear: article.publication_year,
          .version,
          volumeNumber: article.volume_number,
          issueNumber: article.issue_number,
          createdAt: article.created_at,
          updatedAt: article.updated_at
        },
        journal: CASE
          WHEN journal IS NULL THEN NULL
          ELSE journal {
            .id,
            sourceId: journal.source_id,
            displayName: journal.display_name,
            .type,
            isOpenAccess: journal.is_open_access,
            isOaDiamond: journal.is_oa_diamond,
            .coverage,
            .country,
            .region,
            issnList: journal.issn_list,
            publisherName: journal.publisher_name,
            publisherImageUrl: journal.publisher_image_url,
            subjectCategories: journal.subject_categories
          }
        END,
        authors: [row IN author_rows WHERE row.id IS NOT NULL],
        keywords: [row IN keyword_rows WHERE row.id IS NOT NULL],
        topics: [row IN topic_rows WHERE row.id IS NOT NULL],
        citedArticleIds: cited_article_ids
      } AS graph
      `,
      { ids },
      (record) => toPlain(record.get('graph')) as Neo4jArticleGraph,
    );

    const byId = new Map(
      result.records.map((graph) => [graph.article.id, graph] as const),
    );

    return ids.flatMap((id) => {
      const graph = byId.get(id);
      return graph ? [graph] : [];
    });
  }

  async findExistingReferenceIds(
    type: AcademicNodeType,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }

    const label = labelFor(type);
    const result = await this.neo4j.executeRead<{ id: string }>(
      `
      MATCH (node:${label})
      WHERE node.id IN $ids
      RETURN node.id AS id
      `,
      { ids },
      (record) => ({ id: String(record.get('id')) }),
    );

    return new Set(result.records.map((record) => record.id));
  }
}

function toCursorPage<TItem>(
  records: TItem[],
  limit: number,
  getCursor: (item: TItem) => string,
): CursorPage<TItem> {
  const items = records.slice(0, limit);
  const hasNextPage = records.length > limit;

  return {
    items,
    nextCursor:
      hasNextPage && items.length > 0
        ? getCursor(items[items.length - 1])
        : null,
  };
}

function toPlain(value: unknown): unknown {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => toPlain(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    const maybeTemporal = value as {
      year?: unknown;
      month?: unknown;
      day?: unknown;
      toString?: () => string;
    };

    if (
      'year' in maybeTemporal &&
      'month' in maybeTemporal &&
      'day' in maybeTemporal &&
      typeof maybeTemporal.toString === 'function'
    ) {
      return maybeTemporal.toString();
    }

    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [key, toPlain(entry)]),
    );
  }

  return value;
}

function labelFor(type: AcademicNodeType): string {
  const labels: Record<AcademicNodeType, string> = {
    ARTICLE: 'Article',
    AUTHOR: 'Author',
    JOURNAL: 'Journal',
    KEYWORD: 'Keyword',
    TOPIC: 'Topic',
  };

  return labels[type];
}

function toNeo4jArticle(article: ArticleNode) {
  return clean({
    id: article.id,
    title: article.title,
    abstract: article.abstract ?? null,
    doi: article.doi ?? null,
    publication_year: article.publicationYear ?? null,
    version: article.version ?? null,
    volume_number: article.volumeNumber ?? null,
    issue_number: article.issueNumber ?? null,
    created_at: article.createdAt ?? null,
    updated_at: article.updatedAt ?? null,
  });
}

function toNeo4jAuthor(author: AuthorNode) {
  return clean({
    id: author.id,
    orcid: author.orcid ?? null,
    display_name: author.displayName ?? null,
    url_image: author.imageUrl ?? null,
    author_position: author.authorPosition ?? null,
  });
}

function toNeo4jJournal(journal: JournalNode) {
  return clean({
    id: journal.id,
    source_id: journal.sourceId ?? null,
    display_name: journal.displayName ?? null,
    type: journal.type ?? null,
    is_open_access: journal.isOpenAccess ?? null,
    is_oa_diamond: journal.isOaDiamond ?? null,
    coverage: journal.coverage ?? null,
    country: journal.country ?? null,
    region: journal.region ?? null,
    issn_list: journal.issnList ?? null,
    publisher_name: journal.publisherName ?? null,
    publisher_image_url: journal.publisherImageUrl ?? null,
    subject_categories: journal.subjectCategories ?? null,
  });
}

function toNeo4jKeyword(keyword: KeywordNode) {
  return clean({
    id: keyword.id,
    display_name: keyword.displayName ?? null,
    score: keyword.score ?? null,
  });
}

function toNeo4jTopic(topic: TopicNode) {
  return clean({
    id: topic.id,
    display_name: topic.displayName ?? null,
    score: topic.score ?? null,
    is_primary: topic.isPrimary ?? null,
  });
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
