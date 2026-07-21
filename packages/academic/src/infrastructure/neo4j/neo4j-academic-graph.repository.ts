import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import neo4j from 'neo4j-driver';
import {
  AcademicGraphRepository,
  ArticleFollowMatch,
  FollowedTargetGroups,
  FollowTargetRecord,
  FollowTargetReference,
} from '@repo/academic/application/ports/academic-graph.port';
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
  RelatedWorkSnapshot,
  SemanticScholarArticleGraph,
  TopicNode,
} from '@repo/academic/domain/academic-graph.model';
import { normalizeExactName } from '@repo/academic/domain/normalize-exact-name';
import { Neo4jService } from '@repo/neo4j';
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

    await this.backfillCrawlTimestamps();
    await this.backfillExternalArticleIdentifiers();

    await this.neo4j.executeRead('CALL db.awaitIndexes(300)');
  }

  async upsertArticleGraph(graph: ArticleGraph): Promise<void> {
    await this.upsertArticleGraphs([graph]);
  }

  async upsertArticleGraphs(
    graphs: ArticleGraph[],
  ): Promise<{ inserted: number; updated: number }> {
    if (graphs.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    const ids = [...new Set(graphs.map((graph) => graph.article.id))];
    const existingIds = await this.findExistingReferenceIds('ARTICLE', ids);
    await this.neo4j.executeWrite(
      `
      UNWIND $graphs AS graph
      MERGE (article:Article {id: graph.article.id})
      ON CREATE SET article.first_crawled_at = datetime(),
                    article.crawl_source = 'OPENALEX'
      SET article.title = graph.article.title,
          article.abstract = graph.article.abstract,
          article.doi = graph.article.doi,
          article.doi_normalized = CASE
            WHEN graph.article.doi IS NULL THEN article.doi_normalized
            ELSE toLower(graph.article.doi)
          END,
          article.openalex_id = coalesce(graph.article.openalex_id, article.openalex_id, graph.article.id),
          article.publication_year = graph.article.publication_year,
          article.version = graph.article.version,
          article.volume_number = graph.article.volume_number,
          article.issue_number = graph.article.issue_number,
          article.openalex_citation_count = graph.article.openalex_citation_count,
          article.citation_count = CASE
            WHEN graph.article.openalex_citation_count IS NULL THEN article.citation_count
            ELSE CASE
              WHEN article.semantic_scholar_citation_count IS NULL THEN graph.article.openalex_citation_count
              ELSE CASE
                WHEN graph.article.openalex_citation_count >= article.semantic_scholar_citation_count
                  THEN graph.article.openalex_citation_count
                ELSE article.semantic_scholar_citation_count
              END
            END
          END,
          article.work_type = coalesce(graph.article.work_type, article.work_type),
          article.related_sync_eligible = CASE
            WHEN graph.article.related_sync_eligible = true THEN true
            ELSE coalesce(article.related_sync_eligible, false)
          END,
          article.hydration_state = 'HYDRATED',
          article.ingested_at = datetime(),
          article.last_synced_at = datetime(),
          article.crawl_source = coalesce(article.crawl_source, 'OPENALEX'),
          article.citation_count_updated_at = CASE
            WHEN graph.article.citation_count IS NULL THEN article.citation_count_updated_at
            ELSE datetime()
          END,
          article.created_at = coalesce(graph.article.created_at, article.created_at, datetime()),
          article.updated_at = coalesce(graph.article.updated_at, datetime())
      FOREACH (journal_input IN CASE WHEN graph.journal IS NULL THEN [] ELSE [graph.journal] END |
        MERGE (journal:Journal {id: journal_input.id})
        ON CREATE SET journal.first_crawled_at = datetime(),
                      journal.crawl_source = 'OPENALEX'
        SET journal.source_id = journal_input.source_id,
            journal.display_name = journal_input.display_name,
            journal.type = journal_input.type,
            journal.is_open_access = journal_input.is_open_access,
            journal.is_oa_diamond = journal_input.is_oa_diamond,
            journal.coverage = journal_input.coverage,
            journal.country = journal_input.country,
            journal.issn_list = journal_input.issn_list,
            journal.publisher_name = journal_input.publisher_name,
            journal.publisher_name_normalized = journal_input.publisher_name_normalized,
            journal.publisher_image_url = journal_input.publisher_image_url,
            journal.subject_categories = journal_input.subject_categories,
            journal.scimago_source_id = coalesce(journal_input.scimago_source_id, journal.scimago_source_id),
            journal.scimago_catalog_year = coalesce(journal_input.scimago_catalog_year, journal.scimago_catalog_year),
            journal.last_synced_at = datetime(),
            journal.crawl_source = coalesce(journal.crawl_source, 'OPENALEX')
        MERGE (article)-[:PUBLISHED_IN]->(journal)
      )
      FOREACH (author_input IN graph.authors |
        MERGE (author:Author {id: author_input.id})
        SET author.orcid = author_input.orcid,
            author.display_name = author_input.display_name,
            author.url_image = author_input.url_image
        MERGE (author)-[wrote:WROTE]->(article)
        SET wrote.author_position = author_input.author_position
      )
      FOREACH (keyword_input IN graph.keywords |
        MERGE (keyword:Keyword {id: keyword_input.id})
        SET keyword.display_name = keyword_input.display_name
        MERGE (article)-[has_keyword:HAS_KEYWORD]->(keyword)
        SET has_keyword.score = keyword_input.score
      )
      FOREACH (topic_input IN graph.topics |
        MERGE (topic:Topic {id: topic_input.id})
        SET topic.display_name = topic_input.display_name,
            topic.score = topic_input.score
        MERGE (article)-[belongs_to:BELONGS_TO]->(topic)
        SET belongs_to.score = topic_input.score,
            belongs_to.is_primary = topic_input.is_primary
      )
      FOREACH (cited_article_id IN graph.cited_article_ids |
        MERGE (cited:Article {id: cited_article_id})
        ON CREATE SET cited.hydration_state = 'PLACEHOLDER',
                      cited.reference_discovered_at = datetime()
        MERGE (article)-[:CITES]->(cited)
      )
      FOREACH (_ IN CASE
        WHEN graph.related_work_references IS NULL THEN []
        ELSE [1]
      END |
        FOREACH (stale_relationship IN [
          (article)-[candidate:RELATED_TO {source: 'OPENALEX'}]->(stale_target:Article)
          WHERE NOT (stale_target.id IN [reference IN graph.related_work_references | reference.id])
          | candidate
        ] | DELETE stale_relationship)
        FOREACH (related_input IN graph.related_work_references |
          MERGE (target:Article {id: related_input.id})
          ON CREATE SET target.hydration_state = 'PLACEHOLDER',
                        target.related_work_discovered_at = datetime()
          MERGE (article)-[related:RELATED_TO {source: 'OPENALEX'}]->(target)
          SET related.rank = related_input.rank,
              related.status = CASE
                WHEN target.hydration_state = 'HYDRATED'
                  AND target.work_type = 'article' THEN 'ACTIVE'
                ELSE 'PENDING'
              END,
              related.resolve_attempts = CASE
                WHEN target.hydration_state = 'HYDRATED'
                  AND target.work_type = 'article' THEN 0
                ELSE coalesce(related.resolve_attempts, 0)
              END,
              related.synced_at = datetime()
        )
        SET article.related_works_synced_at = datetime()
      )
      RETURN count(article) AS count
      `,
      { graphs: graphs.map(toNeo4jGraph) },
    );

    return {
      inserted: ids.filter((id) => !existingIds.has(id)).length,
      updated: ids.filter((id) => existingIds.has(id)).length,
    };
  }

  async findSemanticScholarDiscoveredPaperIds(
    scimagoSourceId: string,
  ): Promise<Set<string>> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)-[:DISCOVERED_VIA {
        source: 'SEMANTIC_SCHOLAR',
        scimago_source_id: $scimago_source_id
      }]->(:Journal)
      WHERE article.semantic_scholar_id IS NOT NULL
      RETURN DISTINCT article.semantic_scholar_id AS id
      `,
      { scimago_source_id: scimagoSourceId },
      (record) => String(record.get('id')),
    );
    return new Set(result.records);
  }

  async upsertSemanticScholarArticleGraphs(
    graphs: SemanticScholarArticleGraph[],
  ): Promise<{ inserted: number; updated: number }> {
    if (graphs.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    const result = await this.neo4j.executeWrite<{ inserted: number; updated: number }>(
      `
      UNWIND $graphs AS graph
      OPTIONAL MATCH (semantic_match:Article {
        semantic_scholar_id: graph.article.semantic_scholar_id
      })
      WITH graph, [node IN collect(semantic_match) WHERE node IS NOT NULL] AS semantic_matches
      OPTIONAL MATCH (doi_match:Article {doi_normalized: graph.article.doi_normalized})
      WITH graph, semantic_matches,
           [node IN collect(doi_match) WHERE node IS NOT NULL] AS doi_matches
      WITH graph,
           reduce(unique = [], node IN semantic_matches + doi_matches |
             CASE WHEN node IN unique THEN unique ELSE unique + node END
           ) AS matches
      WHERE size(matches) <= 1
      CALL {
        WITH graph, matches
        WITH graph, matches WHERE size(matches) = 1
        RETURN matches[0] AS article, false AS created
        UNION
        WITH graph, matches
        WITH graph, matches WHERE size(matches) = 0
        CREATE (article:Article {id: graph.article.id})
        RETURN article, true AS created
      }
      SET article.semantic_scholar_id = coalesce(article.semantic_scholar_id, graph.article.semantic_scholar_id),
          article.title = coalesce(article.title, graph.article.title),
          article.abstract = coalesce(article.abstract, graph.article.abstract),
          article.doi = coalesce(article.doi, graph.article.doi),
          article.doi_normalized = coalesce(article.doi_normalized, graph.article.doi_normalized),
          article.publication_year = coalesce(article.publication_year, graph.article.publication_year),
          article.work_type = coalesce(article.work_type, graph.article.work_type),
          article.semantic_scholar_venue_name = coalesce(graph.article.semantic_scholar_venue_name, article.semantic_scholar_venue_name),
          article.semantic_scholar_citation_count = graph.article.semantic_scholar_citation_count,
          article.citation_count = CASE
            WHEN graph.article.semantic_scholar_citation_count IS NULL THEN article.citation_count
            WHEN article.openalex_citation_count IS NULL THEN graph.article.semantic_scholar_citation_count
            WHEN article.openalex_citation_count >= graph.article.semantic_scholar_citation_count
              THEN article.openalex_citation_count
            ELSE graph.article.semantic_scholar_citation_count
          END,
          article.hydration_state = coalesce(article.hydration_state, 'HYDRATED'),
          article.first_crawled_at = coalesce(article.first_crawled_at, datetime()),
          article.last_synced_at = datetime(),
          article.ingested_at = datetime(),
          article.crawl_source = coalesce(article.crawl_source, 'SEMANTIC_SCHOLAR'),
          article.citation_count_updated_at = CASE
            WHEN graph.article.semantic_scholar_citation_count IS NULL THEN article.citation_count_updated_at
            ELSE datetime()
          END
      WITH graph, article, created
      MATCH (origin:Journal {id: graph.origin_journal_id})
      MERGE (article)-[:DISCOVERED_VIA {
        source: 'SEMANTIC_SCHOLAR',
        scimago_source_id: graph.scimago_source_id,
        lane: graph.lane
      }]->(origin)
      FOREACH (_ IN CASE WHEN graph.attach_origin_journal THEN [1] ELSE [] END |
        MERGE (article)-[:PUBLISHED_IN]->(origin)
      )
      WITH graph, article, created
      OPTIONAL MATCH (related_source:Article {
        semantic_scholar_id: graph.related_from_semantic_scholar_id
      })
      FOREACH (_ IN CASE WHEN related_source IS NULL THEN [] ELSE [1] END |
        MERGE (related_source)-[related:RELATED_TO {source: 'SEMANTIC_SCHOLAR'}]->(article)
        SET related.status = 'ACTIVE',
            related.rank = coalesce(related.rank, 0),
            related.synced_at = datetime()
      )
      RETURN sum(CASE WHEN created THEN 1 ELSE 0 END) AS inserted,
             sum(CASE WHEN created THEN 0 ELSE 1 END) AS updated
      `,
      { graphs: graphs.map(toNeo4jSemanticScholarGraph) },
      (record) => ({
        inserted: Number(record.get('inserted')?.toString() ?? 0),
        updated: Number(record.get('updated')?.toString() ?? 0),
      }),
    );

    return result.records[0] ?? { inserted: 0, updated: 0 };
  }

  async upsertJournal(journal: JournalNode): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MERGE (journal:Journal {id: $journal.id})
      ON CREATE SET journal.first_crawled_at = datetime(),
                    journal.crawl_source = 'OPENALEX'
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
          journal.subject_categories = $journal.subject_categories,
          journal.scimago_source_id = $journal.scimago_source_id,
          journal.scimago_catalog_year = $journal.scimago_catalog_year,
          journal.last_synced_at = datetime(),
          journal.crawl_source = coalesce(journal.crawl_source, 'OPENALEX')
      `,
      { journal: toNeo4jJournal(journal) },
    );
  }

  async backfillJournalCrawlTimestamps(
    states: Array<{
      openAlexJournalId: string;
      firstCrawledAt: Date;
      lastSyncedAt: Date | null;
    }>,
  ): Promise<void> {
    if (states.length === 0) {
      return;
    }
    await this.neo4j.executeWrite(
      `
      UNWIND $states AS state
      MATCH (journal:Journal {id: state.openalex_journal_id})
      SET journal.first_crawled_at = datetime(state.first_crawled_at),
          journal.last_synced_at = CASE
            WHEN state.last_synced_at IS NULL THEN journal.last_synced_at
            ELSE datetime(state.last_synced_at)
          END,
          journal.crawl_source = coalesce(journal.crawl_source, 'OPENALEX')
      `,
      {
        states: states.map((state) => ({
          openalex_journal_id: state.openAlexJournalId,
          first_crawled_at: state.firstCrawledAt.toISOString(),
          last_synced_at: state.lastSyncedAt?.toISOString() ?? null,
        })),
      },
    );
  }

  private async backfillCrawlTimestamps(): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)
      SET article.first_crawled_at = coalesce(
            article.first_crawled_at,
            article.ingested_at,
            datetime()
          ),
          article.last_synced_at = coalesce(
            article.last_synced_at,
            article.ingested_at,
            article.first_crawled_at
          ),
          article.crawl_source = coalesce(article.crawl_source, 'OPENALEX')
      `,
    );
    await this.neo4j.executeWrite(
      `
      MATCH (journal:Journal)
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, min(article.ingested_at) AS first_article_ingested_at,
           max(article.ingested_at) AS last_article_ingested_at
      SET journal.first_crawled_at = coalesce(
            journal.first_crawled_at,
            first_article_ingested_at,
            datetime()
          ),
          journal.last_synced_at = coalesce(
            journal.last_synced_at,
            last_article_ingested_at,
            journal.first_crawled_at
          ),
          journal.crawl_source = coalesce(journal.crawl_source, 'OPENALEX')
      `,
    );
  }

  private async backfillExternalArticleIdentifiers(): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)
      SET article.openalex_id = coalesce(
            article.openalex_id,
            CASE WHEN article.id STARTS WITH 'W' THEN article.id ELSE NULL END
          ),
          article.doi_normalized = CASE
            WHEN article.doi IS NULL THEN article.doi_normalized
            ELSE toLower(article.doi)
          END,
          article.openalex_citation_count = coalesce(
            article.openalex_citation_count,
            article.citation_count
          )
      `,
    );
    await this.neo4j.executeWrite(
      `
      MATCH ()-[related:RELATED_TO]->()
      WHERE related.source IS NULL
      SET related.source = 'OPENALEX'
      `,
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
      WHERE article.id IN $ids OR article.openalex_id IN $ids
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
        AND article.openalex_id IS NOT NULL
        AND article.citation_count IS NULL
        AND ($cursor IS NULL OR article.id > $cursor)
      RETURN article.openalex_id AS id
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

  async listHydratedArticleIdsMissingOutgoingReferences(
    limit: number,
  ): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND article.openalex_id IS NOT NULL
        AND article.outgoing_references_crawled_at IS NULL
      RETURN article.openalex_id AS id
      ORDER BY article.ingested_at ASC, article.id ASC
      LIMIT $limit
      `,
      { limit: neo4j.int(limit) },
      (record) => String(record.get('id')),
    );

    return result.records;
  }

  async markOutgoingReferencesCrawled(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)
      WHERE article.openalex_id IN $ids OR article.id IN $ids
      SET article.outgoing_references_crawled_at = datetime()
      `,
      { ids },
    );
  }

  async listHydratedArticleIdsForIncomingCitation(input: {
    limit: number;
    ingestedSince: Date;
  }): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND article.openalex_id IS NOT NULL
        AND article.ingested_at >= datetime($ingested_since)
        AND article.incoming_citations_crawled_at IS NULL
      RETURN article.openalex_id AS id
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
      WHERE article.openalex_id IN $ids OR article.id IN $ids
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
        AND article.openalex_id IS NOT NULL
        AND (
          article.citation_count_updated_at IS NULL
          OR article.citation_count_updated_at < datetime($stale_before)
        )
      RETURN article.openalex_id AS id
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
      MATCH (article:Article)
      WHERE article.openalex_id = update.id OR article.id = update.id
        AND article.hydration_state = 'HYDRATED'
      SET article.openalex_citation_count = update.citation_count,
          article.citation_count = CASE
            WHEN article.semantic_scholar_citation_count IS NULL THEN update.citation_count
            WHEN update.citation_count >= article.semantic_scholar_citation_count
              THEN update.citation_count
            ELSE article.semantic_scholar_citation_count
          END,
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

  async backfillRelatedWorkSyncEligibility(): Promise<void> {
    await this.neo4j.executeWrite(
      `
      MATCH (article:Article)-[:PUBLISHED_IN]->(journal:Journal)
      WHERE article.hydration_state = 'HYDRATED'
        AND journal.scimago_source_id IS NOT NULL
      SET article.related_sync_eligible = true
      `,
    );
  }

  async listRelatedWorkSyncRootIds(input: {
    limit: number;
    staleBefore: Date;
  }): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH (article:Article)
      WHERE article.hydration_state = 'HYDRATED'
        AND article.related_sync_eligible = true
        AND article.openalex_id IS NOT NULL
        AND (
          article.related_works_synced_at IS NULL
          OR article.related_works_synced_at < datetime($stale_before)
        )
      RETURN article.openalex_id AS id
      ORDER BY article.related_works_synced_at ASC, article.id ASC
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

  async listPendingRelatedWorkTargetIds(limit: number): Promise<string[]> {
    const result = await this.neo4j.executeRead<string>(
      `
      MATCH ()-[related:RELATED_TO {status: 'PENDING'}]->(target:Article)
      WITH target, min(related.synced_at) AS first_pending_at
      RETURN target.id AS id
      ORDER BY first_pending_at ASC, target.id ASC
      LIMIT $limit
      `,
      { limit: neo4j.int(limit) },
      (record) => String(record.get('id')),
    );

    return result.records;
  }

  async activatePendingRelatedWorkTargets(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      MATCH ()-[related:RELATED_TO {status: 'PENDING'}]->(target:Article)
      WHERE target.id IN $ids
        AND target.hydration_state = 'HYDRATED'
        AND target.work_type = 'article'
      SET related.status = 'ACTIVE',
          related.resolve_attempts = 0,
          related.synced_at = datetime()
      `,
      { ids },
    );
  }

  async discardPendingRelatedWorkTargets(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      MATCH ()-[related:RELATED_TO {status: 'PENDING'}]->(target:Article)
      WHERE target.id IN $ids
      DELETE related
      `,
      { ids },
    );
  }

  async incrementPendingRelatedWorkAttempts(
    ids: string[],
    maxAttempts: number,
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      MATCH ()-[related:RELATED_TO {status: 'PENDING'}]->(target:Article)
      WHERE target.id IN $ids
      SET related.resolve_attempts = coalesce(related.resolve_attempts, 0) + 1
      WITH related
      WHERE related.resolve_attempts >= $max_attempts
      DELETE related
      `,
      { ids, max_attempts: neo4j.int(maxAttempts) },
    );
  }

  async replaceRelatedWorkSnapshots(
    snapshots: RelatedWorkSnapshot[],
  ): Promise<void> {
    if (snapshots.length === 0) {
      return;
    }

    await this.neo4j.executeWrite(
      `
      UNWIND $snapshots AS snapshot
      MATCH (source:Article)
      WHERE source.openalex_id = snapshot.source_id OR source.id = snapshot.source_id
      WITH source, snapshot,
        [(source)-[stale:RELATED_TO {source: 'OPENALEX'}]->(stale_target:Article)
          WHERE NOT (stale_target.id IN snapshot.target_ids) | stale] AS stale_relationships
      FOREACH (stale IN stale_relationships | DELETE stale)
      WITH source, snapshot
      FOREACH (reference IN snapshot.references |
        MERGE (target:Article {id: reference.id})
        ON CREATE SET target.hydration_state = 'PLACEHOLDER',
                      target.related_work_discovered_at = datetime()
        MERGE (source)-[related:RELATED_TO {source: 'OPENALEX'}]->(target)
        SET related.rank = reference.rank,
            related.status = CASE
              WHEN target.hydration_state = 'HYDRATED'
                AND target.work_type = 'article' THEN 'ACTIVE'
              ELSE 'PENDING'
            END,
            related.resolve_attempts = CASE
              WHEN target.hydration_state = 'HYDRATED'
                AND target.work_type = 'article' THEN 0
              ELSE coalesce(related.resolve_attempts, 0)
            END,
            related.synced_at = datetime()
      )
      SET source.work_type = coalesce(snapshot.work_type, source.work_type),
          source.related_works_synced_at = datetime()
      `,
      {
        snapshots: snapshots.map((snapshot) => ({
          source_id: snapshot.sourceId,
          work_type: snapshot.workType ?? null,
          target_ids: snapshot.references.map((reference) => reference.id),
          references: snapshot.references.map((reference) => ({
            id: reference.id,
            rank: neo4j.int(reference.rank),
          })),
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
    openalex_id: article.openAlexId ?? null,
    semantic_scholar_id: article.semanticScholarId ?? null,
    title: article.title,
    abstract: article.abstract ?? null,
    doi: article.doi ?? null,
    doi_normalized: article.doi?.trim().toLowerCase() ?? null,
    publication_year: article.publicationYear ?? null,
    version: article.version ?? null,
    volume_number: article.volumeNumber ?? null,
    issue_number: article.issueNumber ?? null,
    citation_count: article.citationCount ?? null,
    openalex_citation_count: article.openAlexCitationCount ?? null,
    semantic_scholar_citation_count:
      article.semanticScholarCitationCount ?? null,
    semantic_scholar_venue_name: article.semanticScholarVenueName ?? null,
    work_type: article.workType ?? null,
    related_sync_eligible: article.relatedSyncEligible,
    created_at: article.createdAt ?? null,
    updated_at: article.updatedAt ?? null,
  });
}

function toNeo4jSemanticScholarGraph(graph: SemanticScholarArticleGraph) {
  return {
    article: toNeo4jArticle(graph.article),
    scimago_source_id: graph.scimagoSourceId,
    origin_journal_id: graph.originJournalId,
    lane: graph.lane,
    attach_origin_journal: graph.attachOriginJournal,
    related_from_semantic_scholar_id:
      graph.relatedFromSemanticScholarId ?? null,
  };
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
    scimago_source_id: journal.scimagoSourceId ?? null,
    scimago_catalog_year: journal.scimagoCatalogYear ?? null,
  });
}

function toNeo4jGraph(graph: ArticleGraph) {
  return {
    article: toNeo4jArticle(graph.article),
    journal: graph.journal ? toNeo4jJournal(graph.journal) : null,
    authors: (graph.authors ?? []).map(toNeo4jAuthor),
    keywords: (graph.keywords ?? []).map(toNeo4jKeyword),
    topics: (graph.topics ?? []).map(toNeo4jTopic),
    cited_article_ids: graph.citedArticleIds ?? [],
    related_work_references:
      graph.relatedWorkReferences === undefined
        ? null
        : graph.relatedWorkReferences.map((reference) => ({
            id: reference.id,
            rank: reference.rank,
          })),
  };
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
