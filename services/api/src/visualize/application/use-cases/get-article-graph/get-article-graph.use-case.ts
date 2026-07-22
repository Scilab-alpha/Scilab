import { ArticleGraphVisualizationRepository } from '@/visualize/application/ports/article-graph-visualization.port';
import {
  ArticleGraphCursor,
  ArticleGraphNotFoundError,
  InvalidArticleGraphCursorError,
  VisualizedArticle,
} from '@/visualize/domain/article-graph-visualization.model';
import {
  GetArticleGraphInput,
  GetArticleGraphOutput,
} from './get-article-graph.dto';

export class GetArticleGraphUseCase {
  constructor(private readonly graphs: ArticleGraphVisualizationRepository) {}

  async execute(input: GetArticleGraphInput): Promise<GetArticleGraphOutput> {
    const articleId = input.articleId.trim();

    if (!articleId) {
      throw new ArticleGraphNotFoundError();
    }

    const cursor = decodeCursor(input.cursor, articleId);
    const page = await this.graphs.getArticleGraph({
      articleId,
      cursor,
      limit: input.limit,
    });

    if (!page) {
      throw new ArticleGraphNotFoundError();
    }

    const neighbors = page.neighbors.slice(0, input.limit);
    const truncated = page.neighbors.length > input.limit;
    const articles = [page.root, ...neighbors];
    const articleNodeIds = new Set(articles.map((article) => article.id));
    const nodes = toNodes(articles);
    const edges = [
      ...page.edges
        .filter(
          (edge) =>
            articleNodeIds.has(edge.sourceArticleId) &&
            articleNodeIds.has(edge.targetArticleId),
        )
        .map((edge) =>
          toRelatedEdge(edge.sourceArticleId, edge.targetArticleId),
        ),
    ].sort((left, right) => left.id.localeCompare(right.id));

    return {
      edges,
      nextCursor:
        truncated && neighbors.length > 0
          ? encodeCursor(articleId, neighbors[neighbors.length - 1])
          : null,
      nodes,
      truncated,
    };
  }
}

function toNodes(articles: VisualizedArticle[]) {
  return articles.map((article) => ({
    citationCount: article.citationCount,
    id: articleNodeId(article.id),
    type: 'article' as const,
    label: articleLabel(article),
  }));
}

function articleLabel(article: VisualizedArticle): string {
  return article.publicationYear === null
    ? article.title
    : `${article.title} (${article.publicationYear})`;
}

function toRelatedEdge(sourceArticleId: string, targetArticleId: string) {
  const sourceId = articleNodeId(sourceArticleId);
  const targetId = articleNodeId(targetArticleId);

  return {
    id: `${sourceId}->${targetId}`,
    sourceId,
    targetId,
    type: 'RELATED_TO' as const,
  };
}

function articleNodeId(id: string): string {
  return `article:${id}`;
}

type EncodedCursor = ArticleGraphCursor & {
  rootArticleId: string;
  version: 1;
};

function encodeCursor(
  rootArticleId: string,
  neighbor: { id: string; rank: number; tier: 0 | 1 },
): string {
  const payload: EncodedCursor = {
    articleId: neighbor.id,
    rank: neighbor.rank,
    tier: neighbor.tier,
    rootArticleId,
    version: 1,
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(
  cursor: string | null | undefined,
  rootArticleId: string,
): ArticleGraphCursor | null {
  if (!cursor) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<EncodedCursor>;

    if (
      payload.version !== 1 ||
      payload.rootArticleId !== rootArticleId ||
      (payload.tier !== 0 && payload.tier !== 1) ||
      typeof payload.rank !== 'number' ||
      !Number.isInteger(payload.rank) ||
      payload.rank < 0 ||
      typeof payload.articleId !== 'string' ||
      payload.articleId.trim() === ''
    ) {
      throw new InvalidArticleGraphCursorError();
    }

    return {
      articleId: payload.articleId,
      rank: payload.rank,
      tier: payload.tier,
    };
  } catch (error) {
    if (error instanceof InvalidArticleGraphCursorError) {
      throw error;
    }

    throw new InvalidArticleGraphCursorError();
  }
}
