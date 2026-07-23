/** Types for GET /academic/graphs/article/:id (knowledge graph). */

export type ArticleGraphNodeType = "article" | "year";
export type ArticleGraphEdgeType = "RELATED_TO" | "PUBLISHED_IN_YEAR";

export type ArticleGraphNode = {
  /** Prefixed id, e.g. `article:W123` or `year:2026`. */
  id: string;
  type: ArticleGraphNodeType;
  label: string;
  /** Optional inbound citation count from the graph API. */
  citationCount?: number | null;
};

export type ArticleGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: ArticleGraphEdgeType;
};

export type ArticleGraphResponse = {
  nodes: ArticleGraphNode[];
  edges: ArticleGraphEdge[];
  nextCursor: string | null;
  truncated: boolean;
};

export type ArticleGraphParams = {
  cursor?: string | null;
  /** Connected papers per page (backend default 20, max 100). */
  limit?: number;
};

/** `article:W123` → `W123`; returns null for non-article nodes. */
export function articleIdFromNodeId(nodeId: string): string | null {
  return nodeId.startsWith("article:")
    ? nodeId.slice("article:".length)
    : null;
}
