export type RelatedArticleGraphNode = {
  citationCount?: number;
  id: string;
  label: string;
  type: string;
};

export type RelatedArticleGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
};

export type RelatedArticleGraph = {
  edges: RelatedArticleGraphEdge[];
  nextCursor: string | null;
  nodes: RelatedArticleGraphNode[];
  truncated: boolean;
};
