import neo4j from 'neo4j-driver';
import { InvalidArticleKeywordCursorError } from '@/academic/domain/academic-graph.model';
import { Neo4jAcademicGraphRepository } from './neo4j-academic-graph.repository';

describe('Neo4jAcademicGraphRepository', () => {
  it.each([
    ['listArticles', 'article-1'],
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
      const typedParameters = parameters as {
        cursor: string;
        limit: unknown;
      };

      expect(typedParameters.cursor).toBe(cursor);
      expect(neo4j.isInt(typedParameters.limit)).toBe(true);
      expect((typedParameters.limit as { toNumber(): number }).toNumber()).toBe(
        21,
      );
    },
  );

  it('lists authors with cursor pagination', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        {
          id: 'author-2',
          displayName: 'Ada Lovelace',
          articleCount: 4,
        },
        {
          id: 'author-3',
          displayName: 'Adalberto Silva',
          articleCount: 2,
        },
      ],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    const page = await repository.listAuthors({
      cursor: 'author-1',
      limit: 1,
    });

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    const typedParameters = parameters as {
      cursor: string;
      limit: unknown;
    };

    expect(cypher).toContain('MATCH (author:Author)');
    expect(cypher).not.toContain('$keyword');
    expect(cypher).not.toContain('CONTAINS');
    expect(cypher).toContain('ORDER BY author.id ASC');
    expect(typedParameters.cursor).toBe('author-1');
    expect(neo4j.isInt(typedParameters.limit)).toBe(true);
    expect((typedParameters.limit as { toNumber(): number }).toNumber()).toBe(
      2,
    );
    expect(page.items).toEqual([
      {
        id: 'author-2',
        displayName: 'Ada Lovelace',
        articleCount: 4,
      },
    ]);
    expect(page.nextCursor).toBe('author-2');
  });

  it('returns an author by id', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        {
          id: 'author-1',
          displayName: 'Ada Lovelace',
          articleCount: 4,
        },
      ],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    await expect(repository.getAuthorById('author-1')).resolves.toEqual({
      id: 'author-1',
      displayName: 'Ada Lovelace',
      articleCount: 4,
    });

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    const typedParameters = parameters as {
      id: string;
    };

    expect(cypher).toContain('MATCH (author:Author {id: $id})');
    expect(typedParameters.id).toBe('author-1');
  });

  it('searches articles by keyword and sorts by matched keyword score', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        {
          graph: {
            article: {
              id: 'article-1',
              title: 'Machine learning research',
            },
          },
          matchScore: 0.9,
        },
        {
          graph: {
            article: {
              id: 'article-2',
              title: 'Applied machine learning',
            },
          },
          matchScore: 0.7,
        },
      ],
      summary: {},
    });
    const repository = new Neo4jAcademicGraphRepository({
      executeRead,
    } as never);

    const page = await repository.listArticles({
      cursor: null,
      keyword: ' Machine Learning ',
      limit: 1,
    });

    const { cypher, parameters } = firstExecuteReadCall(executeRead);
    const typedParameters = parameters as {
      keyword: string;
      limit: unknown;
    };

    expect(cypher).toContain('HAS_KEYWORD');
    expect(cypher).toContain('ORDER BY match_score DESC, article.id ASC');
    expect(typedParameters.keyword).toBe('machine learning');
    expect(neo4j.isInt(typedParameters.limit)).toBe(true);
    expect((typedParameters.limit as { toNumber(): number }).toNumber()).toBe(
      2,
    );
    expect(page.items).toEqual([
      {
        article: {
          id: 'article-1',
          title: 'Machine learning research',
        },
      },
    ]);
    expect(page.nextCursor).toEqual(expect.any(String));
    expect(JSON.stringify(page.items[0])).not.toContain('matchScore');
  });

  it('rejects keyword cursors that belong to a different keyword', async () => {
    const repository = new Neo4jAcademicGraphRepository({
      executeRead: jest.fn(),
    } as never);
    const cursor = Buffer.from(
      JSON.stringify({
        articleId: 'article-1',
        keyword: 'biology',
        score: 0.9,
      }),
      'utf8',
    ).toString('base64url');

    await expect(
      repository.listArticles({
        cursor,
        keyword: 'machine learning',
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(InvalidArticleKeywordCursorError);
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
