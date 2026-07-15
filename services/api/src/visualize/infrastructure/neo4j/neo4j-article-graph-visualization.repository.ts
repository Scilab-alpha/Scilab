import neo4j from 'neo4j-driver';
import { Injectable } from '@nestjs/common';
import { ArticleGraphVisualizationRepository } from '@/visualize/application/ports/article-graph-visualization.port';
import {
  ArticleGraphPage,
  ArticleGraphQueryInput,
  StoredRelatedEdge,
  VisualizedArticle,
  VisualizedNeighbor,
} from '@/visualize/domain/article-graph-visualization.model';
import { Neo4jService } from '@/neo4j/neo4j.service';

@Injectable()
export class Neo4jArticleGraphVisualizationRepository implements ArticleGraphVisualizationRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async getArticleGraph(
    input: ArticleGraphQueryInput,
  ): Promise<ArticleGraphPage | null> {
    const root = await this.findRoot(input.articleId);

    if (!root) {
      return null;
    }

    const neighbors = await this.findNeighbors(input);
    const articleIds = [
      root.id,
      ...neighbors.slice(0, input.limit).map((neighbor) => neighbor.id),
    ];
    const edges = await this.findRelatedEdges(articleIds);

    return { edges, neighbors, root };
  }

  private async findRoot(articleId: string): Promise<VisualizedArticle | null> {
    const result = await this.neo4j.executeRead<VisualizedArticle>(
      `
      MATCH (root:Article {id: $article_id})
      WHERE root.hydration_state = 'HYDRATED'
        AND coalesce(root.work_type, 'article') = 'article'
      RETURN root {
        .id,
        title: root.title,
        publicationYear: root.publication_year
      } AS article
      `,
      { article_id: articleId },
      (record) => toArticle(record.get('article')),
    );

    return result.records[0] ?? null;
  }

  private async findNeighbors(
    input: ArticleGraphQueryInput,
  ): Promise<VisualizedNeighbor[]> {
    const result = await this.neo4j.executeRead<VisualizedNeighbor>(
      `
      MATCH (root:Article {id: $article_id})
      CALL {
        WITH root
        MATCH (root)-[related:RELATED_TO {status: 'ACTIVE'}]->(neighbor:Article)
        WHERE neighbor.hydration_state = 'HYDRATED'
          AND neighbor.work_type = 'article'
        RETURN neighbor, 0 AS tier, coalesce(related.rank, 2147483647) AS rank
        UNION
        WITH root
        MATCH (neighbor:Article)-[related:RELATED_TO {status: 'ACTIVE'}]->(root)
        WHERE neighbor.hydration_state = 'HYDRATED'
          AND neighbor.work_type = 'article'
          AND NOT EXISTS {
            MATCH (root)-[:RELATED_TO {status: 'ACTIVE'}]->(neighbor)
          }
        RETURN neighbor, 1 AS tier, coalesce(related.rank, 2147483647) AS rank
      }
      WITH neighbor, tier, rank
      WHERE $cursor_tier IS NULL
        OR tier > $cursor_tier
        OR (
          tier = $cursor_tier
          AND (
            rank > $cursor_rank
            OR (rank = $cursor_rank AND neighbor.id > $cursor_article_id)
          )
        )
      RETURN neighbor {
        .id,
        title: neighbor.title,
        publicationYear: neighbor.publication_year
      } AS article,
      tier,
      rank
      ORDER BY tier ASC, rank ASC, article.id ASC
      LIMIT $limit
      `,
      {
        article_id: input.articleId,
        cursor_article_id: input.cursor?.articleId ?? null,
        cursor_rank: input.cursor?.rank ?? null,
        cursor_tier: input.cursor?.tier ?? null,
        limit: neo4j.int(input.limit + 1),
      },
      (record) => ({
        ...toArticle(record.get('article')),
        rank: toNumber(record.get('rank')),
        tier: toTier(record.get('tier')),
      }),
    );

    return result.records;
  }

  private async findRelatedEdges(
    articleIds: string[],
  ): Promise<StoredRelatedEdge[]> {
    if (articleIds.length < 2) {
      return [];
    }

    const result = await this.neo4j.executeRead<StoredRelatedEdge>(
      `
      MATCH (source:Article)-[:RELATED_TO {status: 'ACTIVE'}]->(target:Article)
      WHERE source.id IN $article_ids
        AND target.id IN $article_ids
      RETURN source.id AS source_article_id, target.id AS target_article_id
      ORDER BY source.id ASC, target.id ASC
      `,
      { article_ids: articleIds },
      (record) => ({
        sourceArticleId: String(record.get('source_article_id')),
        targetArticleId: String(record.get('target_article_id')),
      }),
    );

    return result.records;
  }
}

function toArticle(value: unknown): VisualizedArticle {
  const article = value as Record<string, unknown>;

  return {
    id: String(article.id),
    publicationYear: nullableNumber(article.publicationYear),
    title: String(article.title),
  };
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return toNumber(value);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  return Number(value);
}

function toTier(value: unknown): 0 | 1 {
  return toNumber(value) === 1 ? 1 : 0;
}
