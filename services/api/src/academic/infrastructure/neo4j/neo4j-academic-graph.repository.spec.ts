import neo4j from 'neo4j-driver';
import { Neo4jAcademicGraphRepository } from './neo4j-academic-graph.repository';

describe('Neo4jAcademicGraphRepository', () => {
  it.each([
    ['listArticles', 'article-1'],
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

      const parameters = executeRead.mock.calls[0]?.[1] as {
        cursor: string;
        limit: unknown;
      };

      expect(parameters.cursor).toBe(cursor);
      expect(neo4j.isInt(parameters.limit)).toBe(true);
      expect((parameters.limit as neo4j.Integer).toNumber()).toBe(21);
    },
  );
});
