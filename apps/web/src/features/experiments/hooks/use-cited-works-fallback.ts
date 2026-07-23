"use client";

import { useQuery } from "@tanstack/react-query";
import { getArticleById } from "@/features/experiments/api/articles.api";
import { toGraphPaperInfo } from "@/features/experiments/hooks/use-graph-paper-details";
import type { GraphPaperInfo } from "@/features/experiments/types/graph-paper.types";
import type {
  ArticleGraphEdge,
  ArticleGraphNode,
} from "@/features/experiments/types/article-graph.types";
import type { ArticleGraph } from "@/features/experiments/types/article.types";

/** Max papers loaded from the academic articles API. */
const MAX_PAPERS = 12;
/** First-hop citations taken from the origin paper. */
const ROOT_CITE_LIMIT = 8;
/** Extra citations pulled from each neighbor to densify the graph. */
const EXPAND_CITE_LIMIT = 4;
/** Every paper should link to at least this many other API papers. */
const MIN_DEGREE = 2;

export type CitedWorksFallback = {
  nodes: ArticleGraphNode[];
  edges: ArticleGraphEdge[];
  papers: Record<string, GraphPaperInfo>;
};

function articleNodeId(id: string) {
  return `article:${id}`;
}

function undirectedKey(left: string, right: string) {
  return left < right ? `${left}::${right}` : `${right}::${left}`;
}

/**
 * Connects the origin paper to catalog articles via citations, expands one hop,
 * and ensures every paper links to at least two other API-available papers.
 */
export function useCitedWorksFallback(
  articleId: string,
  rootPaper: GraphPaperInfo | null,
  citedArticleIds: string[],
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "article-connect-papers",
      articleId,
      citedArticleIds.slice(0, ROOT_CITE_LIMIT),
      MIN_DEGREE,
    ] as const,
    enabled: enabled && articleId.trim().length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<CitedWorksFallback> => {
      const details = new Map<string, ArticleGraph | null>();

      async function loadArticle(id: string) {
        const trimmed = id.trim();
        if (!trimmed || details.has(trimmed) || details.size >= MAX_PAPERS) {
          return;
        }

        // Reserve the slot so parallel callers don't over-fetch.
        details.set(trimmed, null);
        try {
          const detail = await getArticleById(trimmed);
          details.set(trimmed, detail);
        } catch {
          details.delete(trimmed);
        }
      }

      // Keep origin in the pool even if /articles/:id is skipped (we already have it).
      if (rootPaper) {
        details.set(articleId, {
          article: {
            id: articleId,
            title: rootPaper.title,
            abstract: rootPaper.abstract,
            doi: null,
            publicationYear: rootPaper.year,
            version: null,
            volumeNumber: null,
            issueNumber: null,
            citationCount: rootPaper.citationCount,
            createdAt: null,
            updatedAt: null,
          },
          journal: rootPaper.journal
            ? {
                id: "local-journal",
                sourceId: null,
                displayName: rootPaper.journal,
                type: null,
                isOpenAccess: null,
                isOaDiamond: null,
                coverage: null,
                country: null,
                region: null,
                issnList: null,
                publisherName: null,
                publisherImageUrl: null,
                subjectCategories: null,
              }
            : null,
          authors: rootPaper.authors.map((name, index) => ({
            id: `local-author-${index}`,
            orcid: null,
            displayName: name,
            imageUrl: null,
            authorPosition: index + 1,
          })),
          keywords: [],
          topics: [],
          citedArticleIds,
        });
      } else {
        await loadArticle(articleId);
      }

      const rootCited = citedArticleIds
        .map((id) => id.trim())
        .filter((id) => id && id !== articleId)
        .slice(0, ROOT_CITE_LIMIT);

      await Promise.all(rootCited.map((id) => loadArticle(id)));

      // Expand one hop from API-available neighbors so the pool is dense enough.
      const firstHopIds = [...details.keys()].filter((id) => id !== articleId);
      for (const neighborId of firstHopIds) {
        if (details.size >= MAX_PAPERS) {
          break;
        }
        const neighbor = details.get(neighborId);
        const nextIds = (neighbor?.citedArticleIds ?? [])
          .map((id) => id.trim())
          .filter((id) => id && id !== articleId && !details.has(id))
          .slice(0, EXPAND_CITE_LIMIT);
        await Promise.all(nextIds.map((id) => loadArticle(id)));
      }

      const availableIds = [...details.entries()]
        .filter(([, detail]) => detail !== null)
        .map(([id]) => id);

      if (!availableIds.includes(articleId) && rootPaper) {
        availableIds.unshift(articleId);
      }

      const edgeKeys = new Set<string>();
      const edges: ArticleGraphEdge[] = [];

      function addEdge(sourceId: string, targetId: string) {
        if (sourceId === targetId) {
          return false;
        }
        if (!availableIds.includes(sourceId) || !availableIds.includes(targetId)) {
          return false;
        }
        const key = undirectedKey(sourceId, targetId);
        if (edgeKeys.has(key)) {
          return false;
        }
        edgeKeys.add(key);
        edges.push({
          id: `${articleNodeId(sourceId)}->${articleNodeId(targetId)}`,
          sourceId: articleNodeId(sourceId),
          targetId: articleNodeId(targetId),
          type: "RELATED_TO",
        });
        return true;
      }

      function degree(id: string) {
        let count = 0;
        for (const key of edgeKeys) {
          const [left, right] = key.split("::");
          if (left === id || right === id) {
            count += 1;
          }
        }
        return count;
      }

      // Real citation links between API-available papers.
      for (const id of availableIds) {
        const detail = details.get(id);
        for (const citedId of detail?.citedArticleIds ?? []) {
          const trimmed = citedId.trim();
          if (availableIds.includes(trimmed)) {
            addEdge(id, trimmed);
          }
        }
      }

      // Guarantee every paper connects to at least MIN_DEGREE others in the pool.
      if (availableIds.length >= MIN_DEGREE + 1) {
        for (const id of availableIds) {
          const candidates = availableIds
            .filter((other) => other !== id)
            .sort((left, right) => {
              // Prefer linking to the origin, then to papers that already have fewer edges.
              if (left === articleId) return -1;
              if (right === articleId) return 1;
              return degree(left) - degree(right);
            });

          for (const candidate of candidates) {
            if (degree(id) >= MIN_DEGREE) {
              break;
            }
            addEdge(id, candidate);
          }
        }
      }

      const papers: Record<string, GraphPaperInfo> = {};
      const nodes: ArticleGraphNode[] = [];

      for (const id of availableIds) {
        const detail = details.get(id);
        const info =
          id === articleId && rootPaper
            ? { ...rootPaper, id: articleId }
            : detail
              ? toGraphPaperInfo(detail)
              : {
                  id,
                  title: id,
                  authors: [] as string[],
                  year: null,
                  journal: null,
                  abstract: null,
                  citationCount: 0,
                };
        papers[id] = info;
        nodes.push({
          id: articleNodeId(id),
          type: "article",
          label: info.title,
        });
      }

      // Keep origin first for stable layout/list ordering.
      nodes.sort((left, right) => {
        if (left.id === articleNodeId(articleId)) return -1;
        if (right.id === articleNodeId(articleId)) return 1;
        return left.label.localeCompare(right.label);
      });

      return { nodes, edges, papers };
    },
  });
}
