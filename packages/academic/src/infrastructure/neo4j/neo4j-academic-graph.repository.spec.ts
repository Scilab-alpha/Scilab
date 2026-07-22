import neo4j from 'neo4j-driver';
import { InvalidArticleListCursorError } from '@repo/academic/domain/academic-graph.model';
import { ACADEMIC_GRAPH_SCHEMA_CYPHER } from './academic-graph-schema.cypher';
import { Neo4jAcademicGraphRepository } from './neo4j-academic-graph.repository';

describe('Neo4jAcademicGraphRepository', () => {
  it('defines composite indexes for the admin article and journal listings', () => {
    expect(ACADEMIC_GRAPH_SCHEMA_CYPHER).toEqual(
      expect.arrayContaining([
        expect.stringContaining('article_admin_listing_index'),
        expect.stringContaining('article_admin_source_listing_index'),
        expect.stringContaining('journal_admin_listing_index'),
        expect.stringContaining('journal_admin_source_listing_index'),
      ]),
    );
  });

  it('backfills legacy data in bounded batches', async () => {
    const articleBatches = [['article-1'], []] as string[][];
    const executeRead = jest.fn().mockImplementation((cypher: string) => {
      if (cypher.includes('WHERE article.first_crawled_at IS NULL')) {
        return Promise.resolve({ records: articleBatches.shift() ?? [] });
      }
      return Promise.resolve({ records: [] });
    });
    const executeWrite = jest.fn().mockImplementation((cypher: string) => {
      if (cypher.includes('RETURN count(related) AS updated')) {
        return Promise.resolve({ records: [0] });
      }
      return Promise.resolve({ records: [] });
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
      executeWrite,
    } as never);

    await repository.ensureSchema();

    const articleUpdate = executeWrite.mock.calls.find(([cypher]) =>
      String(cypher).includes(
        'UNWIND $ids AS id\n      MATCH (article:Article {id: id})',
      ),
    );
    expect(articleUpdate?.[1]).toMatchObject({ ids: ['article-1'] });
    expect(executeRead).toHaveBeenCalledWith(
      expect.stringContaining('WHERE article.first_crawled_at IS NULL'),
      expect.objectContaining({ limit: expect.anything() }),
      expect.any(Function),
    );
  });

  it('chunks journal-state timestamp backfills at 500 records', async () => {
    const executeWrite = jest.fn().mockResolvedValue({ records: [] });
    const repository = new Neo4jAcademicGraphRepository({
      executeWrite,
    } as never);
    const states = Array.from({ length: 501 }, (_, index) => ({
      openAlexJournalId: `S${index}`,
      firstCrawledAt: new Date('2026-07-22T00:00:00.000Z'),
      lastSyncedAt: null,
    }));

    await repository.backfillJournalCrawlTimestamps(states);

    expect(executeWrite).toHaveBeenCalledTimes(2);
    expect(executeWrite.mock.calls[0]?.[1]).toMatchObject({
      states: expect.arrayContaining([
        expect.objectContaining({ openalex_journal_id: 'S0' }),
      ]),
    });
    expect(
      (executeWrite.mock.calls[0]?.[1] as { states: unknown[] }).states,
    ).toHaveLength(500);
    expect(
      (executeWrite.mock.calls[1]?.[1] as { states: unknown[] }).states,
    ).toHaveLength(1);
  });

  it.each([
    ['listAuthors', 'author-1'],
    ['listJournals', 'journal-1'],
  ] as const)(
    'passes an explicit Neo4j integer limit to %s',
    async (method, cursor) => {
      const executeRead = jest.fn().mockResolvedValue({
        records: [],
        summary: {},
      });
      const repository = new Neo4jAcademicGraphRepository({
        executeRead,
      } as never);

      await repository[method]({ cursor, limit: 20 });

      const { parameters } = firstExecuteReadCall(executeRead);
      expect(neo4j.isInt(parameters.limit)).toBe(true);
      expect((parameters.limit as { toNumber(): number }).toNumber()).toBe(21);
    },
  );

  it('lists authors with cursor pagination', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        { id: 'author-2', displayName: 'Ada Lovelace', articleCount: 4 },
        { id: 'author-3', displayName: 'Adalberto Silva', articleCount: 2 },
      ],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    const page = await repository.listAuthors({ cursor: 'author-1', limit: 1 });
    const { cypher } = firstExecuteReadCall(executeRead);

    expect(cypher).toContain('ORDER BY author.id ASC');
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('author-2');
  });

  it('uses full-text title and abstract search with weighted RRF', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        {
          graph: {
            article: { id: 'article-1', title: 'Machine learning research' },
          },
          sortValue: 0.01,
        },
        {
          graph: {
            article: { id: 'article-2', title: 'Applied machine learning' },
          },
          sortValue: 0.009,
        },
      ],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    const page = await repository.listArticles({
      cursor: null,
      q: 'Machine Learning',
      limit: 1,
      sort: 'relevant',
    });
    const { cypher, parameters } = firstExecuteReadCall(executeRead);

    expect(cypher).toContain('db.index.fulltext.queryNodes');
    expect(cypher).toContain('0.60 / (60.0 + text_rank)');
    expect(cypher).toContain("article.hydration_state = 'HYDRATED'");
    expect(cypher).toContain('citationCount: article.citation_count');
    expect(cypher).not.toContain('.region');
    expect(parameters.lucene_query).toContain('title:');
    expect(parameters.lucene_query).toContain('^8');
    expect(parameters.lucene_query).toContain('abstract:');
    expect(parameters.q).toBe('machine learning');
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('escapes Lucene operators supplied by users', async () => {
    const executeRead = jest
      .fn()
      .mockResolvedValue({ records: [], summary: {} });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    await repository.listArticles({
      q: 'graph+(R&D):2026',
      limit: 20,
      sort: 'relevant',
    });

    const { parameters } = firstExecuteReadCall(executeRead);
    expect(parameters.lucene_query).toContain('graph\\+\\(r&d\\)\\:2026');
  });

  it('passes exact filters to newest queries', async () => {
    const executeRead = jest
      .fn()
      .mockResolvedValue({ records: [], summary: {} });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    await repository.listArticles({
      authorId: 'author-1',
      country: 'US',
      journalId: 'journal-1',
      limit: 20,
      publicationYearFrom: 2020,
      publisher: 'scilab press',
      sort: 'newest',
    });

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    expect(cypher).toContain(
      'filter_journal.publisher_name_normalized = $publisher',
    );
    expect(parameters).toMatchObject({
      author_id: 'author-1',
      country: 'US',
      journal_id: 'journal-1',
      publication_year_from: 2020,
      publisher: 'scilab press',
    });
  });

  it('rejects cursors that do not match the normalized query', async () => {
    const repository = new Neo4jAcademicGraphRepository({
      executeRead: jest.fn(),
    } as never);
    const cursor = Buffer.from(
      JSON.stringify({
        version: 1,
        articleId: 'article-1',
        signature: 'different-query',
        sort: 'relevant',
        sortValue: 0.9,
      }),
      'utf8',
    ).toString('base64url');

    await expect(
      repository.listArticles({
        cursor,
        q: 'machine learning',
        limit: 20,
        sort: 'relevant',
      }),
    ).rejects.toBeInstanceOf(InvalidArticleListCursorError);
  });

  it('marks hydrated works and never downgrades existing cited nodes', async () => {
    const executeWrite = jest
      .fn()
      .mockResolvedValue({ records: [], summary: {} });
    const repository = new Neo4jAcademicGraphRepository({
      executeWrite,
      executeRead: jest.fn().mockResolvedValue({ records: [], summary: {} }),
    } as never);

    await repository.upsertArticleGraph({
      article: {
        id: 'article-1',
        title: 'Hydrated article',
        citationCount: 3,
      },
      citedArticleIds: ['article-2'],
      relatedWorkReferences: [{ id: 'article-3', rank: 1 }],
    });

    const [cypher, parameters] = executeWrite.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(cypher).toContain("article.hydration_state = 'HYDRATED'");
    expect(cypher).toContain(
      "ON CREATE SET cited.hydration_state = 'PLACEHOLDER'",
    );
    expect(cypher).toContain('graph.related_work_references');
    expect(cypher).toContain(
      "MERGE (article)-[related:RELATED_TO {source: 'OPENALEX'}]->(target)",
    );
    expect(executeWrite).toHaveBeenCalledTimes(1);
    const [graph] = parameters.graphs as Array<{
      article: { citation_count: number };
      related_work_references: Array<{ id: string; rank: number }>;
    }>;
    expect(graph.article.citation_count).toBe(3);
    expect(graph.related_work_references).toEqual([
      { id: 'article-3', rank: 1 },
    ]);
  });

  it('replaces only the source outgoing related-work snapshot', async () => {
    const executeWrite = jest
      .fn()
      .mockResolvedValue({ records: [], summary: {} });
    const repository = new Neo4jAcademicGraphRepository({
      executeWrite,
    } as never);

    await repository.replaceRelatedWorkSnapshots(
      [
        {
          sourceId: 'article-1',
          workType: 'article',
          references: [{ id: 'article-2', rank: 1 }],
        },
      ],
      'openalex-related-work-limit:20',
    );

    const [cypher, parameters] = executeWrite.mock.calls[0] as [
      string,
      { snapshots: Array<{ target_ids: string[] }> },
    ];
    expect(cypher).toContain(
      "(source)-[stale:RELATED_TO {source: 'OPENALEX'}]->(stale_target:Article)",
    );
    expect(cypher).toContain(
      "SET stale.status = 'INACTIVE', stale.deactivated_at = datetime()",
    );
    expect(cypher).toContain(
      "MERGE (source)-[related:RELATED_TO {source: 'OPENALEX'}]->(target)",
    );
    expect(cypher).not.toContain('CITES');
    expect(parameters.snapshots[0]?.target_ids).toEqual(['article-2']);
  });

  it('selects only high-citation related-work roots and refreshes a changed policy', async () => {
    const executeRead = jest.fn().mockResolvedValue({ records: [] });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    await repository.listRelatedWorkSyncRootIds({
      limit: 20,
      staleBefore: new Date('2026-07-20T00:00:00.000Z'),
      citationThreshold: 500,
      policySignature: 'openalex-related-work-limit:20',
    });

    const [cypher, parameters] = executeRead.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(cypher).toContain(
      'coalesce(article.citation_count, 0) > $citation_threshold',
    );
    expect(cypher).toContain(
      'article.related_work_policy_signature <> $policy_signature',
    );
    expect(parameters).toMatchObject({
      citation_threshold: expect.anything(),
      policy_signature: 'openalex-related-work-limit:20',
    });
  });

  it('uses legacy string-safe datetime conversion for alert article matching', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);
    const since = new Date('2026-06-01T00:00:00.000Z');

    await repository.findArticlesMatchingFollowedTargets(
      {
        journals: ['journal-1'],
        keywords: [],
        topics: [],
      },
      since,
    );

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    expect(cypher).toContain('datetime(toString(article.created_at))');
    expect(parameters).toMatchObject({
      journals: ['journal-1'],
      since: since.toISOString(),
    });
  });
});

function firstExecuteReadCall(executeRead: { mock: { calls: unknown[][] } }): {
  cypher: string;
  parameters: Record<string, unknown>;
} {
  const [cypher, parameters] = executeRead.mock.calls[0] ?? [];

  return {
    cypher: String(cypher),
    parameters: parameters as Record<string, unknown>,
  };
}
