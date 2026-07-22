import neo4j from 'neo4j-driver';
import { InvalidArticleListCursorError } from '@repo/academic/domain/academic-graph.model';
import { Neo4jAcademicGraphRepository } from './neo4j-academic-graph.repository';

describe('Neo4jAcademicGraphRepository', () => {
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

    await repository.replaceRelatedWorkSnapshots([
      {
        sourceId: 'article-1',
        workType: 'article',
        references: [{ id: 'article-2', rank: 1 }],
      },
    ]);

    const [cypher, parameters] = executeWrite.mock.calls[0] as [
      string,
      { snapshots: Array<{ target_ids: string[] }> },
    ];
    expect(cypher).toContain(
      "(source)-[stale:RELATED_TO {source: 'OPENALEX'}]->(stale_target:Article)",
    );
    expect(cypher).toContain(
      'FOREACH (stale IN stale_relationships | DELETE stale)',
    );
    expect(cypher).toContain(
      "MERGE (source)-[related:RELATED_TO {source: 'OPENALEX'}]->(target)",
    );
    expect(cypher).not.toContain('CITES');
    expect(parameters.snapshots[0]?.target_ids).toEqual(['article-2']);
  });

  it('resolves Semantic Scholar articles by source ID then unique DOI and retains both citation sources', async () => {
    const executeWrite = jest.fn().mockResolvedValue({
      records: [],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeWrite,
    } as never);

    await repository.upsertSemanticScholarArticleGraphs([
      {
        article: {
          id: 'S2:paper-1',
          semanticScholarId: 'paper-1',
          title: 'Semantic paper',
          doi: '10.1/example',
          semanticScholarCitationCount: 15,
        },
        scimagoSourceId: '28773',
        originJournalId: 'S1',
        lane: 'RELATED',
        attachOriginJournal: true,
      },
    ]);

    const [cypher] = executeWrite.mock.calls[0] as [string];
    expect(cypher).toContain(
      'semantic_scholar_id: graph.article.semantic_scholar_id',
    );
    expect(cypher).toContain('doi_normalized: graph.article.doi_normalized');
    expect(cypher).toContain('WHERE size(matches) <= 1');
    expect(cypher).toContain(
      'UNION\n        WITH graph, matches\n        WITH graph, matches WHERE size(matches) = 0',
    );
    expect(cypher).toContain(
      'END\n      WITH graph, article, created\n      MATCH (origin:Journal',
    );
    expect(cypher).toContain(
      'MERGE (article)-[:PUBLISHED_IN]->(origin)\n      )\n      WITH graph, article, created\n      OPTIONAL MATCH',
    );
    expect(cypher).toContain('article.semantic_scholar_citation_count');
    expect(cypher).toContain(
      'article.openalex_citation_count >= graph.article.semantic_scholar_citation_count',
    );
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
        authors: [],
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
      authors: [],
      since: since.toISOString(),
    });
  });

  it('matches followed authors through article authorship', async () => {
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
        authors: ['author-1'],
        journals: [],
        keywords: [],
        topics: [],
      },
      since,
    );

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    expect(cypher).toContain(
      'OPTIONAL MATCH (matched_author:Author)-[:WROTE]->(article)',
    );
    expect(cypher).toContain(
      "collect(DISTINCT {type: 'AUTHOR', id: matched_author.id}) AS author_matches",
    );
    expect(cypher).toContain(
      'journal_matches + keyword_matches + topic_matches + author_matches',
    );
    expect(parameters).toMatchObject({
      authors: ['author-1'],
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
