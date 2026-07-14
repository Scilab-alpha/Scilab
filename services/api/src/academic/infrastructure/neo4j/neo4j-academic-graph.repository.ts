import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import neo4j from 'neo4j-driver';
import {
  AcademicGraphRepository,
  ArticleFollowMatch,
  FollowedTargetGroups,
  FollowTargetRecord,
  FollowTargetReference,
} from '@/academic/application/ports/academic-graph.port';
import {
  AcademicNodeType,
  ArticleListInput,
  ArticleGraph,
  ArticleNode,
  AuthorListItem,
  CursorPage,
  CursorPaginationInput,
  AuthorNode,
  InvalidArticleListCursorError,
  JournalListItem,
  JournalNode,
  KeywordNode,
  TopicNode,
} from '@/academic/domain/academic-graph.model';
import { normalizeExactName } from '@/academic/domain/normalize-exact-name';
import { Neo4jService } from '@/neo4j/neo4j.service';
import { ACADEMIC_GRAPH_SCHEMA_CYPHER } from './academic-graph-schema.cypher';

type Neo4jArticleGraph = ArticleGraph;
type Neo4jListedArticleGraph = {
  graph: ArticleGraph;
  sortValue: number | null;
};
type Neo4jAuthorListItem = AuthorListItem;
type Neo4jJournalListItem = JournalListItem;

const ARTICLE_FILTER_CYPHER = articleFilter('article');
const ARTICLE_GRAPH_PROJECTION = `{
  article: article {
    .id,
    .title,
    .abstract,
    .doi,
    publicationYear: article.publication_year,
    .version,
    volumeNumber: article.volume_number,
    issueNumber: article.issue_number,
    citationCount: article.citation_count,
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
}`;

@Injectable()
export class Neo4jAcademicGraphRepository implements AcademicGraphRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async ensureSchema(): Promise<void> {
    for (const cypher of ACADEMIC_GRAPH_SCHEMA_CYPHER) {
      await this.neo4j.executeWrite(cypher);
    }

    await this.neo4j.executeRead('CALL db.awaitIndexes(300)');
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
          article.citation_count = $article.citation_count,
          article.hydration_state = 'HYDRATED',
          article.ingested_at = datetime(),
          article.citation_count_updated_at = CASE
            WHEN $article.citation_count IS NULL THEN article.citation_count_updated_at
            ELSE datetime()
          END,
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
            journal.issn_list = $journal.issn_list,
            journal.publisher_name = $journal.publisher_name,
            journal.publisher_name_normalized = $journal.publisher_name_normalized,
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
        ON CREATE SET cited.hydration_state = 'PLACEHOLDER',
                      cited.reference_discovered_at = datetime()
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
    input: ArticleListInput,
  ): Promise<CursorPage<ArticleGraph>> {
    return input.sort === 'relevant'
      ? this.listRelevantArticles(input)
      : this.listSortedArticles(input);
  }

  private async listSortedArticles(
    input: ArticleListInput,
  ): Promise<CursorPage<ArticleGraph>> {
    const limit = input.limit + 1;
    const signature = articleQuerySignature(input);
    const cursor = decodeArticleCursor(input.cursor, input.sort, signature);
    const sortProperty =
      input.sort === 'most_cited'
        ? 'article.citation_count'
        : 'article.publication_year';
    const result = await this.neo4j.executeRead<Neo4jListedArticleGraph>(
      `
      MATCH (article:Article)
      WHERE ${ARTICLE_FILTER_CYPHER}
      WITH article, ${sortProperty} AS sort_value
      WHERE $cursor_article_id IS NULL
         OR ($cursor_value IS NOT NULL AND (
              sort_value < $cursor_value
              OR sort_value IS NULL
              OR (sort_value = $cursor_value AND article.id > $cursor_article_id)
            ))
         OR ($cursor_value IS NULL AND sort_value IS NULL AND article.id > $cursor_article_id)
      ORDER BY CASE WHEN sort_value IS NULL THEN 1 ELSE 0 END ASC,
               sort_value DESC,
               article.id ASC
      LIMIT $limit
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, sort_value,
           collect(DISTINCT author {
             .id,
             .orcid,
             displayName: author.display_name,
             imageUrl: author.url_image,
             authorPosition: wrote.author_position
           }) AS author_rows
      OPTIONAL MATCH (article)-[has_keyword:HAS_KEYWORD]->(keyword:Keyword)
      WITH article, journal, sort_value, author_rows,
           collect(DISTINCT keyword {
             .id,
             displayName: keyword.display_name,
             score: has_keyword.score
           }) AS keyword_rows
      OPTIONAL MATCH (article)-[belongs_to:BELONGS_TO]->(topic:Topic)
      WITH article, journal, sort_value, author_rows, keyword_rows,
           collect(DISTINCT topic {
             .id,
             displayName: topic.display_name,
             score: belongs_to.score,
             isPrimary: belongs_to.is_primary
           }) AS topic_rows
      OPTIONAL MATCH (article)-[:CITES]->(cited:Article)
      WITH article, journal, sort_value, author_rows, keyword_rows, topic_rows,
           collect(DISTINCT cited.id) AS cited_article_ids
      RETURN ${ARTICLE_GRAPH_PROJECTION} AS graph, sort_value
      ORDER BY CASE WHEN sort_value IS NULL THEN 1 ELSE 0 END ASC,
               sort_value DESC,
               article.id ASC
      `,
      {
        cursor_article_id: cursor?.articleId ?? null,
        cursor_value: cursor?.sortValue ?? null,
        ...toArticleQueryParameters(input),
        limit: neo4j.int(limit),
      },
      mapListedArticleRecord,
    );

    return toArticleCursorPage(result.records, input, signature);
  }

  private async listRelevantArticles(
    input: ArticleListInput,
  ): Promise<CursorPage<ArticleGraph>> {
    const limit = input.limit + 1;
    const signature = articleQuerySignature(input);
    const cursor = decodeArticleCursor(input.cursor, input.sort, signature);
    const result = await this.neo4j.executeRead<Neo4jListedArticleGraph>(
      `
      CALL {
        CALL db.index.fulltext.queryNodes(
          'article_title_abstract_fulltext',
          $lucene_query
        ) YIELD node, score
        WHERE ${articleFilter('node')}
        WITH node, score
        ORDER BY score DESC, node.id ASC
        WITH collect({id: node.id, score: score}) AS ordered_rows
        RETURN CASE
          WHEN size(ordered_rows) = 0 THEN []
          ELSE [index IN range(0, size(ordered_rows) - 1) |
            {id: ordered_rows[index].id, rank: index + 1}]
        END AS text_rows
      }
      CALL {
        MATCH (article:Article)-[matched:HAS_KEYWORD]->(matched_node:Keyword)
        WHERE ${ARTICLE_FILTER_CYPHER}
          AND (
            ($q IS NOT NULL AND toLower(coalesce(matched_node.display_name, '')) CONTAINS $q)
            OR ($keyword_id IS NOT NULL AND matched_node.id = $keyword_id)
          )
        WITH article, max(coalesce(matched.score, 0.0)) AS source_score
        ORDER BY source_score DESC, article.id ASC
        WITH collect({id: article.id, score: source_score}) AS ordered_rows
        RETURN CASE
          WHEN size(ordered_rows) = 0 THEN []
          ELSE [index IN range(0, size(ordered_rows) - 1) |
            {id: ordered_rows[index].id, rank: index + 1}]
        END AS keyword_rows_ranked
      }
      CALL {
        MATCH (article:Article)-[matched:BELONGS_TO]->(matched_node:Topic)
        WHERE ${ARTICLE_FILTER_CYPHER}
          AND (
            ($q IS NOT NULL AND toLower(coalesce(matched_node.display_name, '')) CONTAINS $q)
            OR ($topic_id IS NOT NULL AND matched_node.id = $topic_id)
          )
        WITH article, max(coalesce(matched.score, 0.0)) AS source_score
        ORDER BY source_score DESC, article.id ASC
        WITH collect({id: article.id, score: source_score}) AS ordered_rows
        RETURN CASE
          WHEN size(ordered_rows) = 0 THEN []
          ELSE [index IN range(0, size(ordered_rows) - 1) |
            {id: ordered_rows[index].id, rank: index + 1}]
        END AS topic_rows_ranked
      }
      WITH text_rows, keyword_rows_ranked, topic_rows_ranked,
           [row IN text_rows | row.id]
             + [row IN keyword_rows_ranked | row.id]
             + [row IN topic_rows_ranked | row.id] AS candidate_ids
      UNWIND candidate_ids AS candidate_id
      WITH DISTINCT candidate_id, text_rows, keyword_rows_ranked, topic_rows_ranked
      MATCH (article:Article {id: candidate_id})
      WITH article,
           head([row IN text_rows WHERE row.id = article.id | row.rank]) AS text_rank,
           head([row IN keyword_rows_ranked WHERE row.id = article.id | row.rank]) AS keyword_rank,
           head([row IN topic_rows_ranked WHERE row.id = article.id | row.rank]) AS topic_rank
      WITH article,
           CASE WHEN text_rank IS NULL THEN 0.0 ELSE 0.60 / (60.0 + text_rank) END
           + CASE WHEN keyword_rank IS NULL THEN 0.0 ELSE 0.20 / (60.0 + keyword_rank) END
           + CASE WHEN topic_rank IS NULL THEN 0.0 ELSE 0.20 / (60.0 + topic_rank) END
           AS sort_value
      WHERE $cursor_article_id IS NULL
         OR sort_value < $cursor_value
         OR (sort_value = $cursor_value AND article.id > $cursor_article_id)
      ORDER BY sort_value DESC, article.id ASC
      LIMIT $limit
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, sort_value,
           collect(DISTINCT author {
             .id,
             .orcid,
             displayName: author.display_name,
             imageUrl: author.url_image,
             authorPosition: wrote.author_position
           }) AS author_rows
      OPTIONAL MATCH (article)-[has_keyword:HAS_KEYWORD]->(keyword:Keyword)
      WITH article, journal, sort_value, author_rows,
           collect(DISTINCT keyword {
             .id,
             displayName: keyword.display_name,
             score: has_keyword.score
           }) AS keyword_rows
      OPTIONAL MATCH (article)-[belongs_to:BELONGS_TO]->(topic:Topic)
      WITH article, journal, sort_value, author_rows, keyword_rows,
           collect(DISTINCT topic {
             .id,
             displayName: topic.display_name,
             score: belongs_to.score,
             isPrimary: belongs_to.is_primary
           }) AS topic_rows
      OPTIONAL MATCH (article)-[:CITES]->(cited:Article)
      WITH article, journal, sort_value, author_rows, keyword_rows, topic_rows,
           collect(DISTINCT cited.id) AS cited_article_ids
      RETURN ${ARTICLE_GRAPH_PROJECTION} AS graph, sort_value
      ORDER BY sort_value DESC, article.id ASC
      `,
      {
        cursor_article_id: cursor?.articleId ?? null,
        cursor_value: cursor?.sortValue ?? null,
        lucene_query: buildLuceneQuery(input.q),
        ...toArticleQueryParameters(input),
        limit: neo4j.int(limit),
      },
      mapListedArticleRecord,
    );

    return toArticleCursorPage(result.records, input, signature);
  }

  async getArticleById(id: string): Promise<ArticleGraph | null> {
    const [article] = await this.findArticlesByIds([id]);
    return article ?? null;
  }

  async listAuthors(
    input: CursorPaginationInput,
  ): Promise<CursorPage<AuthorListItem>> {
    const limit = input.limit + 1;
    const result = await this.neo4j.executeRead<Neo4jAuthorListItem>(
      `
      MATCH (author:Author)
      WHERE $cursor IS NULL OR author.id > $cursor
      WITH author
      ORDER BY author.id ASC
      LIMIT $limit
      OPTIONAL MATCH (author)-[:WROTE]->(article:Article)
      WITH author, count(article) AS article_count
      RETURN author {
        .id,
        .orcid,
        displayName: author.display_name,
        imageUrl: author.url_image,
        articleCount: article_count
      } AS author
      `,
      {
        cursor: input.cursor ?? null,
        limit: neo4j.int(limit),
      },
      (record) => toPlain(record.get('author')) as Neo4jAuthorListItem,
    );

    return toCursorPage(result.records, input.limit, (author) => author.id);
  }

  async getAuthorById(id: string): Promise<AuthorListItem | null> {
    const result = await this.neo4j.executeRead<Neo4jAuthorListItem>(
      `
      MATCH (author:Author {id: $id})
      OPTIONAL MATCH (author)-[:WROTE]->(article:Article)
      WITH author, count(article) AS article_count
      RETURN author {
        .id,
        .orcid,
        displayName: author.display_name,
        imageUrl: author.url_image,
        articleCount: article_count
      } AS author
      `,
      { id },
      (record) => toPlain(record.get('author')) as Neo4jAuthorListItem,
    );

    return result.records[0] ?? null;
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
        AND article.hydration_state = 'HYDRATED'
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
      RETURN ${ARTICLE_GRAPH_PROJECTION} AS graph
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

  async backfillHydrationStateAndRemoveRegion(): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)
      SET article.hydration_state = CASE
        WHEN article.title IS NOT NULL AND trim(article.title) <> ''
          THEN 'HYDRATED'
        ELSE 'PLACEHOLDER'
      END
      `,
    );
    await this.neo4j.executeWrite(
      `
      MATCH (journal:Journal)
      REMOVE journal.region
      `,
    );
    await this.neo4j.executeWrite('DROP INDEX journal_region_index IF EXISTS');
  }

  async listJournalsForPublisherNormalization(
    input: CursorPaginationInput,
  ): Promise<CursorPage<{ id: string; publisherName: string }>> {
    const result = await this.neo4j.executeRead<{
      id: string;
      publisherName: string;
    }>(
      `
      MATCH (journal:Journal)
      WHERE journal.publisher_name IS NOT NULL
        AND ($cursor IS NULL OR journal.id > $cursor)
      RETURN journal.id AS id, journal.publisher_name AS publisher_name
      ORDER BY journal.id ASC
      LIMIT $limit
      `,
      {
        cursor: input.cursor ?? null,
        limit: neo4j.int(input.limit + 1),
      },
      (record) => ({
        id: String(record.get('id')),
        publisherName: String(record.get('publisher_name')),
      }),
    );

    return toCursorPage(result.records, input.limit, (item) => item.id);
  }

  async updatePublisherNameNormalizations(
    updates: Array<{ id: string; normalizedName: string }>,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      UNWIND $updates AS update
      MATCH (journal:Journal {id: update.id})
      SET journal.publisher_name_normalized = update.normalized_name
      `,
      {
        updates: updates.map((update) => ({
          id: update.id,
          normalized_name: update.normalizedName,
        })),
      },
    );
  }

  async listHydratedArticleIdsMissingCitation(
    input: CursorPaginationInput,
  ): Promise<CursorPage<string>> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND article.citation_count IS NULL
        AND ($cursor IS NULL OR article.id > $cursor)
      RETURN article.id AS id
      ORDER BY article.id ASC
      LIMIT $limit
      `,
      {
        cursor: input.cursor ?? null,
        limit: neo4j.int(input.limit + 1),
      },
      (record) => String(record.get('id')),
    );

    return toCursorPage(result.records, input.limit, (id) => id);
  }

  async listPlaceholderArticleIds(limit: number): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'PLACEHOLDER'
      RETURN article.id AS id
      ORDER BY article.reference_discovered_at ASC, article.id ASC
      LIMIT $limit
      `,
      { limit: neo4j.int(limit) },
      (record) => String(record.get('id')),
    );

    return result.records;
  }

  async listHydratedArticleIdsForIncomingCitation(input: {
    limit: number;
    ingestedSince: Date;
  }): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND article.ingested_at >= datetime($ingested_since)
        AND article.incoming_citations_crawled_at IS NULL
      RETURN article.id AS id
      ORDER BY article.ingested_at ASC, article.id ASC
      LIMIT $limit
      `,
      {
        limit: neo4j.int(input.limit),
        ingested_since: input.ingestedSince.toISOString(),
      },
      (record) => String(record.get('id')),
    );

    return result.records;
  }

  async markIncomingCitationCrawled(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)
      WHERE article.id IN $ids
      SET article.incoming_citations_crawled_at = datetime()
      `,
      { ids },
    );
  }

  async listHydratedArticleIdsNeedingCitation(input: {
    limit: number;
    staleBefore: Date;
  }): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND (
          article.citation_count_updated_at IS NULL
          OR article.citation_count_updated_at < datetime($stale_before)
        )
      RETURN article.id AS id
      ORDER BY article.citation_count_updated_at ASC, article.id ASC
      LIMIT $limit
      `,
      {
        limit: neo4j.int(input.limit),
        stale_before: input.staleBefore.toISOString(),
      },
      (record) => String(record.get('id')),
    );

    return result.records;
  }

  async updateArticleCitationCounts(
    updates: Array<{ id: string; citationCount: number }>,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      UNWIND $updates AS update
      MATCH (article:Article {id: update.id})
      WHERE article.hydration_state = 'HYDRATED'
      SET article.citation_count = update.citation_count,
          article.citation_count_updated_at = datetime()
      `,
      {
        updates: updates.map((update) => ({
          id: update.id,
          citation_count: neo4j.int(update.citationCount),
        })),
      },
    );
  }

  async findFollowTargetsByReferences(
    refs: FollowTargetReference[],
  ): Promise<FollowTargetRecord[]> {
    if (refs.length === 0) {
      return [];
    }

    const groups = groupFollowReferences(refs);
    const result = await this.neo4j.executeRead<FollowTargetRecord>(
      `
      CALL {
        WITH $journals AS ids
        MATCH (node:Journal)
        WHERE node.id IN ids
        RETURN 'JOURNAL' AS type,
               node.id AS id,
               node.display_name AS display_name,
               node.source_id AS source_id,
               node.type AS journal_type,
               node.country AS country,
               node.region AS region,
               null AS score
        UNION
        WITH $keywords AS ids
        MATCH (node:Keyword)
        WHERE node.id IN ids
        RETURN 'KEYWORD' AS type,
               node.id AS id,
               node.display_name AS display_name,
               null AS source_id,
               null AS journal_type,
               null AS country,
               null AS region,
               null AS score
        UNION
        WITH $topics AS ids
        MATCH (node:Topic)
        WHERE node.id IN ids
        RETURN 'TOPIC' AS type,
               node.id AS id,
               node.display_name AS display_name,
               null AS source_id,
               null AS journal_type,
               null AS country,
               null AS region,
               node.score AS score
      }
      RETURN type, id, display_name, source_id, journal_type, country, region, score
      `,
      { ...groups },
      (record) => ({
        type: String(record.get('type')) as FollowTargetRecord['type'],
        id: String(record.get('id')),
        displayName: nullableString(record.get('display_name')),
        sourceId: nullableString(record.get('source_id')),
        journalType: nullableString(record.get('journal_type')),
        country: nullableString(record.get('country')),
        region: nullableString(record.get('region')),
        score: nullableNumber(record.get('score')),
      }),
    );

    const byKey = new Map(
      result.records.map((target) => [targetKey(target), target] as const),
    );

    return refs.flatMap((ref) => {
      const target = byKey.get(targetKey(ref));
      return target ? [target] : [];
    });
  }

  async findArticlesMatchingFollowedTargets(
    groups: FollowedTargetGroups,
    since: Date,
  ): Promise<ArticleFollowMatch[]> {
    if (
      groups.journals.length === 0 &&
      groups.keywords.length === 0 &&
      groups.topics.length === 0
    ) {
      return [];
    }

    const result = await this.neo4j.executeRead<ArticleFollowMatch>(
      `
      MATCH (article:Article)
      WITH article,
           CASE
             WHEN article.created_at IS NULL THEN NULL
             ELSE datetime(toString(article.created_at))
           END AS article_created_at
      WHERE article_created_at IS NULL OR article_created_at >= datetime($since)
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(matched_journal:Journal)
      WHERE matched_journal.id IN $journals
      WITH article,
           collect(DISTINCT {type: 'JOURNAL', id: matched_journal.id}) AS journal_matches
      OPTIONAL MATCH (article)-[:HAS_KEYWORD]->(matched_keyword:Keyword)
      WHERE matched_keyword.id IN $keywords
      WITH article, journal_matches,
           collect(DISTINCT {type: 'KEYWORD', id: matched_keyword.id}) AS keyword_matches
      OPTIONAL MATCH (article)-[:BELONGS_TO]->(matched_topic:Topic)
      WHERE matched_topic.id IN $topics
      WITH article, journal_matches, keyword_matches,
           collect(DISTINCT {type: 'TOPIC', id: matched_topic.id}) AS topic_matches
      WITH article,
           [row IN journal_matches + keyword_matches + topic_matches WHERE row.id IS NOT NULL] AS matches
      WHERE size(matches) > 0
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, matches,
           collect(DISTINCT author {
             .id,
             .orcid,
             displayName: author.display_name,
             imageUrl: author.url_image,
             authorPosition: wrote.author_position
           }) AS author_rows
      OPTIONAL MATCH (article)-[has_keyword:HAS_KEYWORD]->(keyword:Keyword)
      WITH article, journal, matches, author_rows,
           collect(DISTINCT keyword {
             .id,
             displayName: keyword.display_name,
             score: has_keyword.score
           }) AS keyword_rows
      OPTIONAL MATCH (article)-[belongs_to:BELONGS_TO]->(topic:Topic)
      WITH article, journal, matches, author_rows, keyword_rows,
           collect(DISTINCT topic {
             .id,
             displayName: topic.display_name,
             score: belongs_to.score,
             isPrimary: belongs_to.is_primary
           }) AS topic_rows
      OPTIONAL MATCH (article)-[:CITES]->(cited:Article)
      WITH article, journal, matches, author_rows, keyword_rows, topic_rows,
           collect(DISTINCT cited.id) AS cited_article_ids
      RETURN {
        article: ${ARTICLE_GRAPH_PROJECTION},
        matches: matches
      } AS row
      `,
      {
        ...groups,
        since: since.toISOString(),
      },
      (record) => {
        const row = record.get('row') as {
          article: ArticleGraph;
          matches: FollowTargetReference[];
        };

        return {
          article: toPlain(row.article) as ArticleGraph,
          matches: row.matches.map((match) => ({
            type: String(match.type) as FollowTargetReference['type'],
            id: String(match.id),
          })),
        };
      },
    );

    return result.records;
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

type ArticleCursor = {
  version: 1;
  signature: string;
  sort: ArticleListInput['sort'];
  sortValue: number | null;
  articleId: string;
};

function encodeArticleCursor(
  sort: ArticleListInput['sort'],
  signature: string,
  item: Neo4jListedArticleGraph,
): string {
  const payload: ArticleCursor = {
    version: 1,
    articleId: item.graph.article.id,
    signature,
    sort,
    sortValue: item.sortValue,
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeArticleCursor(
  cursor: string | null | undefined,
  sort: ArticleListInput['sort'],
  signature: string,
): ArticleCursor | null {
  if (!cursor) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<ArticleCursor>;

    if (
      payload.version !== 1 ||
      payload.signature !== signature ||
      payload.sort !== sort ||
      typeof payload.articleId !== 'string' ||
      payload.articleId.trim() === '' ||
      (payload.sortValue !== null &&
        (typeof payload.sortValue !== 'number' ||
          !Number.isFinite(payload.sortValue)))
    ) {
      throw new InvalidArticleListCursorError();
    }

    return {
      version: 1,
      articleId: payload.articleId,
      signature,
      sort,
      sortValue: payload.sortValue ?? null,
    };
  } catch (error) {
    if (error instanceof InvalidArticleListCursorError) {
      throw error;
    }

    throw new InvalidArticleListCursorError();
  }
}

function toArticleCursorPage(
  records: Neo4jListedArticleGraph[],
  input: ArticleListInput,
  signature: string,
): CursorPage<ArticleGraph> {
  const pageRecords = records.slice(0, input.limit);
  const hasNextPage = records.length > input.limit;

  return {
    items: pageRecords.map((record) => record.graph),
    nextCursor:
      hasNextPage && pageRecords.length > 0
        ? encodeArticleCursor(
            input.sort,
            signature,
            pageRecords[pageRecords.length - 1],
          )
        : null,
  };
}

function mapListedArticleRecord(record: {
  get(key: string): unknown;
}): Neo4jListedArticleGraph {
  const plainSortValue = toPlain(record.get('sort_value'));

  return {
    graph: toPlain(record.get('graph')) as Neo4jArticleGraph,
    sortValue:
      plainSortValue === null || plainSortValue === undefined
        ? null
        : Number(plainSortValue),
  };
}

function articleQuerySignature(input: ArticleListInput): string {
  const signatureInput = {
    authorId: input.authorId ?? null,
    country: input.country ?? null,
    journalId: input.journalId ?? null,
    keywordId: input.keywordId ?? null,
    publicationYear: input.publicationYear ?? null,
    publicationYearFrom: input.publicationYearFrom ?? null,
    publicationYearTo: input.publicationYearTo ?? null,
    publisher: input.publisher ?? null,
    q: normalizeSearchQuery(input.q),
    sort: input.sort,
    topicId: input.topicId ?? null,
  };

  return createHash('sha256')
    .update(JSON.stringify(signatureInput))
    .digest('base64url');
}

function toArticleQueryParameters(input: ArticleListInput) {
  return {
    author_id: input.authorId ?? null,
    country: input.country ?? null,
    journal_id: input.journalId ?? null,
    keyword_id: input.keywordId ?? null,
    publication_year: input.publicationYear ?? null,
    publication_year_from: input.publicationYearFrom ?? null,
    publication_year_to: input.publicationYearTo ?? null,
    publisher: input.publisher ?? null,
    q: normalizeSearchQuery(input.q),
    topic_id: input.topicId ?? null,
  };
}

function normalizeSearchQuery(value?: string | null): string | null {
  const normalized = value
    ?.normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en-US');

  return normalized || null;
}

function buildLuceneQuery(value?: string | null): string {
  const normalized = normalizeSearchQuery(value);

  if (!normalized) {
    return '__scilab_no_text_query__';
  }

  const escapedPhrase = escapeLucene(normalized);
  const allTerms = normalized
    .split(' ')
    .map(escapeLucene)
    .filter(Boolean)
    .join(' AND ');

  return [
    `title:"${escapedPhrase}"^8`,
    `title:(${allTerms})^4`,
    `abstract:"${escapedPhrase}"^2`,
    `abstract:(${allTerms})`,
  ].join(' OR ');
}

function escapeLucene(value: string): string {
  return value.replace(/(&&|\|\||[+\-!(){}[\]^"~*?:\\/])/gu, '\\$1');
}

function articleFilter(alias: string): string {
  return `
    ${alias}.hydration_state = 'HYDRATED'
    AND ($publication_year IS NULL OR ${alias}.publication_year = $publication_year)
    AND ($publication_year_from IS NULL OR ${alias}.publication_year >= $publication_year_from)
    AND ($publication_year_to IS NULL OR ${alias}.publication_year <= $publication_year_to)
    AND ($author_id IS NULL OR EXISTS {
      MATCH (filter_author:Author {id: $author_id})-[:WROTE]->(${alias})
    })
    AND ($keyword_id IS NULL OR EXISTS {
      MATCH (${alias})-[:HAS_KEYWORD]->(:Keyword {id: $keyword_id})
    })
    AND ($topic_id IS NULL OR EXISTS {
      MATCH (${alias})-[:BELONGS_TO]->(:Topic {id: $topic_id})
    })
    AND (
      ($journal_id IS NULL AND $publisher IS NULL AND $country IS NULL)
      OR EXISTS {
        MATCH (${alias})-[:PUBLISHED_IN]->(filter_journal:Journal)
        WHERE ($journal_id IS NULL OR filter_journal.id = $journal_id)
          AND ($publisher IS NULL OR filter_journal.publisher_name_normalized = $publisher)
          AND ($country IS NULL OR filter_journal.country = $country)
      }
    )
  `;
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

function groupFollowReferences(
  refs: FollowTargetReference[],
): FollowedTargetGroups {
  const groups: FollowedTargetGroups = {
    journals: [],
    keywords: [],
    topics: [],
  };

  for (const ref of refs) {
    if (ref.type === 'JOURNAL') {
      groups.journals.push(ref.id);
    } else if (ref.type === 'KEYWORD') {
      groups.keywords.push(ref.id);
    } else {
      groups.topics.push(ref.id);
    }
  }

  return {
    journals: unique(groups.journals),
    keywords: unique(groups.keywords),
    topics: unique(groups.topics),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function targetKey(ref: FollowTargetReference): string {
  return `${ref.type}:${ref.id}`;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (isNeo4jNumber(value)) {
    return value.toNumber();
  }

  return null;
}

interface Neo4jNumberLike {
  toNumber(): number;
}

function isNeo4jNumber(value: unknown): value is Neo4jNumberLike {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return typeof (value as { toNumber?: unknown }).toNumber === 'function';
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
    citation_count: article.citationCount ?? null,
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
    issn_list: journal.issnList ?? null,
    publisher_name: journal.publisherName ?? null,
    publisher_name_normalized: normalizeExactName(journal.publisherName),
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
