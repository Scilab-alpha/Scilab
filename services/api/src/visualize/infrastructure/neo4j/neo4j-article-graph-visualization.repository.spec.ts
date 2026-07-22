import { Neo4jArticleGraphVisualizationRepository } from './neo4j-article-graph-visualization.repository';

describe('Neo4jArticleGraphVisualizationRepository', () => {
  it('uses only active RELATED_TO edges and never queries CITES', async () => {
    const cypher: string[] = [];
    const executeRead = jest
      .fn()
      .mockImplementation(
        (
          query: string,
          _params: unknown,
          mapper: (record: { get(key: string): unknown }) => unknown,
        ) => {
          cypher.push(query);
          if (query.includes('CALL {')) {
            return Promise.resolve({ records: [] });
          }
          if (query.includes('MATCH (root:Article')) {
            return Promise.resolve({
              records: [
                mapper({
                  get: () => ({
                    id: 'W1',
                    title: 'Root',
                    publicationYear: 2024,
                  }),
                }),
              ],
            });
          }
          return Promise.resolve({ records: [] });
        },
      );
    const repository = new Neo4jArticleGraphVisualizationRepository({
      executeRead,
    } as never);

    await expect(
      repository.getArticleGraph({ articleId: 'W1', cursor: null, limit: 20 }),
    ).resolves.toMatchObject({ root: { id: 'W1' }, neighbors: [], edges: [] });

    expect(cypher.join('\n')).toContain("RELATED_TO {status: 'ACTIVE'}");
    expect(cypher.join('\n')).not.toContain('CITES');
  });
});
