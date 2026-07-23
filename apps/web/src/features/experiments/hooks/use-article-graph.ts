"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { getArticleGraph } from "@/features/experiments/api/graph.api";
import type {
  ArticleGraphEdge,
  ArticleGraphNode,
} from "@/features/experiments/types/article-graph.types";

const GRAPH_PAGE_LIMIT = 100;

/** Loads the article knowledge graph page by page and merges the results. */
export function useArticleGraph(articleId: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ["article-graph", articleId],
    staleTime: listQueryStaleTimeMs,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getArticleGraph(articleId, {
        cursor: pageParam,
        limit: GRAPH_PAGE_LIMIT,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && articleId.trim().length > 0,
  });

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, ArticleGraphNode>();
    const edgeMap = new Map<string, ArticleGraphEdge>();
    for (const page of query.data?.pages ?? []) {
      for (const node of page.nodes) {
        nodeMap.set(node.id, node);
      }
      for (const edge of page.edges) {
        edgeMap.set(edge.id, edge);
      }
    }
    return { nodes: [...nodeMap.values()], edges: [...edgeMap.values()] };
  }, [query.data]);

  return {
    nodes,
    edges,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}
