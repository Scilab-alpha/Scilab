"use client";

import { useQuery } from "@tanstack/react-query";
import { getArticleById } from "@/features/experiments/api/articles.api";
import type { GraphPaperInfo } from "@/features/experiments/types/graph-paper.types";
import {
  getArticleAbstract,
  getArticleAuthorNames,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
} from "@/features/experiments/utils/article-format";
import type { ArticleGraph } from "@/features/experiments/types/article.types";

export function toGraphPaperInfo(detail: ArticleGraph): GraphPaperInfo {
  return {
    id: detail.article.id,
    title: getArticleTitle(detail),
    authors: getArticleAuthorNames(detail),
    year: getArticleYear(detail),
    journal:
      getArticleJournal(detail) === "No journal"
        ? null
        : getArticleJournal(detail),
    abstract:
      getArticleAbstract(detail) === "Abstract unavailable."
        ? null
        : getArticleAbstract(detail),
    citationCount: detail.article.citationCount ?? 0,
  };
}

/** True when we only have a thin graph-node seed (label/citations). */
export function isSparseGraphPaper(paper?: GraphPaperInfo | null) {
  if (!paper) {
    return true;
  }
  return paper.authors.length === 0 && !paper.journal && !paper.abstract;
}

/** Prefetch paper detail cards for graph article node ids. */
export function useGraphPaperDetails(
  articleIds: string[],
  seeded: Record<string, GraphPaperInfo> = {},
  enabled = true,
) {
  const uniqueIds = [
    ...new Set(articleIds.map((id) => id.trim()).filter(Boolean)),
  ];

  // Still hydrate papers that were only seeded from graph labels.
  const missingIds = uniqueIds.filter((id) => isSparseGraphPaper(seeded[id]));

  const query = useQuery({
    queryKey: ["graph-paper-details", missingIds] as const,
    enabled: enabled && missingIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const entries = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const detail = await getArticleById(id);
            return [id, toGraphPaperInfo(detail)] as const;
          } catch {
            return null;
          }
        }),
      );

      const map: Record<string, GraphPaperInfo> = {};
      for (const entry of entries) {
        if (entry) {
          map[entry[0]] = entry[1];
        }
      }
      return map;
    },
  });

  const papers: Record<string, GraphPaperInfo> = {
    ...seeded,
    ...(query.data ?? {}),
  };

  // Prefer richer citation counts from the graph seed when detail omits them.
  for (const id of uniqueIds) {
    const seededPaper = seeded[id];
    const paper = papers[id];
    if (
      paper &&
      seededPaper &&
      (paper.citationCount ?? 0) === 0 &&
      (seededPaper.citationCount ?? 0) > 0
    ) {
      papers[id] = {
        ...paper,
        citationCount: seededPaper.citationCount,
      };
    }
  }

  return {
    papers,
    isLoading: query.isLoading && missingIds.length > 0,
    pendingCount: missingIds.length,
  };
}
