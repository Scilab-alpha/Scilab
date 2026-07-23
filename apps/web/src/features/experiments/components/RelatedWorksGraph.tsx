"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Minus,
  Network,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useArticleGraph } from "@/features/experiments/hooks/use-article-graph";
import { useCitedWorksFallback } from "@/features/experiments/hooks/use-cited-works-fallback";
import { useGraphPaperDetails } from "@/features/experiments/hooks/use-graph-paper-details";
import { isSparseGraphPaper } from "@/features/experiments/hooks/use-graph-paper-details";
import { articleIdFromNodeId } from "@/features/experiments/types/article-graph.types";
import type {
  ArticleGraphEdge,
  ArticleGraphNode,
} from "@/features/experiments/types/article-graph.types";
import type { GraphPaperInfo } from "@/features/experiments/types/graph-paper.types";
import { shortAuthorLabel } from "@/features/experiments/types/graph-paper.types";
import {
  isConnectPapersSource,
  isPublicApiGraphSource,
  relatedWorksGraphSource,
} from "@/features/experiments/config/related-works-graph.config";
import { cn } from "@/shared/components/ui/utils";

const WIDTH = 920;
const HEIGHT = 580;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

type PositionedNode = ArticleGraphNode & {
  x: number;
  y: number;
  radius: number;
};

function hashUnit(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}

function layoutArticleNodes(
  rootId: string,
  nodes: ArticleGraphNode[],
  papers: Record<string, GraphPaperInfo>,
): Map<string, PositionedNode> {
  const articles = nodes.filter((node) => node.type === "article");
  const positioned = new Map<string, PositionedNode>();
  const satellites = articles.filter((node) => node.id !== rootId);

  const rootPaper = papers[articleIdFromNodeId(rootId) ?? ""];
  positioned.set(rootId, {
    id: rootId,
    type: "article",
    label: rootPaper?.title ?? nodes.find((n) => n.id === rootId)?.label ?? "",
    x: CENTER_X,
    y: CENTER_Y,
    radius: 18,
  });

  satellites.forEach((node, index) => {
    const paperId = articleIdFromNodeId(node.id) ?? node.id;
    const paper = papers[paperId];
    const t = (index + 0.5) / Math.max(satellites.length, 1);
    const angle =
      t * Math.PI * 2 +
      (hashUnit(`${node.id}:a`) - 0.5) * 0.55;
    const ring = 0.32 + hashUnit(`${node.id}:r`) * 0.28;
    const radius =
      8 +
      Math.min(
        10,
        ((paper?.citationCount ?? node.citationCount ?? 0) as number) / 4,
      );

    positioned.set(node.id, {
      ...node,
      x: CENTER_X + Math.cos(angle) * WIDTH * ring * 0.48,
      y: CENTER_Y + Math.sin(angle) * HEIGHT * ring * 0.46,
      radius,
    });
  });

  return positioned;
}

function truncateLabel(label: string, max = 42) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function articleNodeCount(nodes: ArticleGraphNode[]) {
  return nodes.filter((node) => node.type === "article").length;
}

type RelatedWorksGraphProps = {
  articleId: string;
  citedArticleIds?: string[];
  rootPaper?: GraphPaperInfo | null;
};

/** Connected-Papers-style explorer for related / cited works. */
export function RelatedWorksGraph({
  articleId,
  citedArticleIds = [],
  rootPaper = null,
}: RelatedWorksGraphProps) {
  const router = useRouter();
  const rootNodeId = `article:${articleId}`;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(rootNodeId);
  const [zoom, setZoom] = useState(1);

  const usePublicApi = isPublicApiGraphSource();
  const useConnectPapers = isConnectPapersSource();

  const {
    nodes: relatedNodes,
    edges: relatedEdges,
    isLoading: isRelatedLoading,
    isLoadingMore,
    hasMore,
    error: relatedError,
    loadMore,
  } = useArticleGraph(articleId, usePublicApi);

  const {
    data: citationGraph,
    isLoading: isConnectLoading,
    error: connectError,
  } = useCitedWorksFallback(
    articleId,
    rootPaper,
    citedArticleIds,
    useConnectPapers,
  );

  const connectHasNeighbors =
    useConnectPapers &&
    Boolean(citationGraph) &&
    articleNodeCount(citationGraph?.nodes ?? []) > 1;

  const publicApiHasNeighbors =
    usePublicApi && articleNodeCount(relatedNodes) > 1;

  const graphNodes = useMemo(() => {
    const seed = [
      {
        id: rootNodeId,
        type: "article" as const,
        label: rootPaper?.title ?? "Current article",
        citationCount: rootPaper?.citationCount ?? null,
      },
    ];

    if (usePublicApi) {
      return relatedNodes.length > 0 ? relatedNodes : seed;
    }

    if (useConnectPapers) {
      if (citationGraph?.nodes?.length) {
        return citationGraph.nodes;
      }
      return seed;
    }

    return seed;
  }, [
    useConnectPapers,
    usePublicApi,
    citationGraph?.nodes,
    relatedNodes,
    rootNodeId,
    rootPaper?.title,
    rootPaper?.citationCount,
  ]);

  const graphEdges = useMemo(() => {
    if (useConnectPapers) {
      return citationGraph?.edges ?? [];
    }
    if (usePublicApi) {
      return relatedEdges;
    }
    return [];
  }, [
    useConnectPapers,
    usePublicApi,
    citationGraph?.edges,
    relatedEdges,
  ]);

  const articleNodes = useMemo(
    () => graphNodes.filter((node) => node.type === "article"),
    [graphNodes],
  );

  const articleEdges = useMemo(
    () =>
      graphEdges.filter((edge) => {
        const source = articleIdFromNodeId(edge.sourceId);
        const target = articleIdFromNodeId(edge.targetId);
        return Boolean(source && target) && edge.type === "RELATED_TO";
      }),
    [graphEdges],
  );

  const seededPapers = useMemo(() => {
    const map: Record<string, GraphPaperInfo> = {
      ...(citationGraph?.papers ?? {}),
    };

    // Thin seeds from graph labels (title + citationCount). Full metadata is
    // hydrated via GET /academic/articles/:id in useGraphPaperDetails.
    for (const node of articleNodes) {
      const id = articleIdFromNodeId(node.id);
      if (!id || map[id]) {
        continue;
      }
      const yearMatch = node.label.match(/\((\d{4})\)\s*$/);
      map[id] = {
        id,
        title: yearMatch
          ? node.label.replace(/\s*\(\d{4}\)\s*$/, "").trim()
          : node.label,
        authors: [],
        year: yearMatch ? Number(yearMatch[1]) : null,
        journal: null,
        abstract: null,
        citationCount: node.citationCount ?? 0,
      };
    }

    if (rootPaper) {
      map[articleId] = rootPaper;
    }
    return map;
  }, [articleId, articleNodes, citationGraph?.papers, rootPaper]);

  const detailIds = useMemo(
    () =>
      articleNodes
        .map((node) => articleIdFromNodeId(node.id))
        .filter((id): id is string => Boolean(id)),
    [articleNodes],
  );

  const { papers: fetchedPapers, isLoading: isDetailsLoading } =
    useGraphPaperDetails(
      detailIds,
      seededPapers,
      articleNodes.length > 1,
    );

  const papers = fetchedPapers;

  const displayNodes = useMemo(() => {
    if (articleNodes.length > 0) {
      return articleNodes;
    }
    return [
      {
        id: rootNodeId,
        type: "article" as const,
        label: rootPaper?.title ?? "Current article",
      },
    ];
  }, [articleNodes, rootNodeId, rootPaper?.title]);

  const displayEdges = articleEdges;

  const displayPositioned = useMemo(
    () => layoutArticleNodes(rootNodeId, displayNodes, papers),
    [rootNodeId, displayNodes, papers],
  );

  useEffect(() => {
    setSelectedId(rootNodeId);
    setZoom(1);
  }, [articleId, rootNodeId]);

  useEffect(() => {
    if (!displayPositioned.has(selectedId) && displayPositioned.size > 0) {
      setSelectedId(rootNodeId);
    }
  }, [displayPositioned, rootNodeId, selectedId]);

  const selectedPaperId = articleIdFromNodeId(selectedId);
  const selectedPaper =
    (selectedPaperId ? papers[selectedPaperId] : null) ??
    (selectedPaperId === articleId ? rootPaper : null);

  const listPapers = useMemo(() => {
    return displayNodes
      .map((node) => {
        const id = articleIdFromNodeId(node.id);
        if (!id) {
          return null;
        }
        return (
          papers[id] ?? {
            id,
            title: node.label,
            authors: [],
            year: null,
            journal: null,
            abstract: null,
            citationCount: 0,
          }
        );
      })
      .filter((paper): paper is GraphPaperInfo => paper !== null)
      .sort((left, right) => {
        if (left.id === articleId) {
          return -1;
        }
        if (right.id === articleId) {
          return 1;
        }
        return left.title.localeCompare(right.title);
      });
  }, [displayNodes, papers, articleId]);

  const displayListPapers = listPapers;

  const isGraphLoading =
    (usePublicApi && isRelatedLoading) ||
    (useConnectPapers && isConnectLoading);

  if (isGraphLoading) {
    return (
      <Card className="p-8 border-border flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading related works graph…
      </Card>
    );
  }

  const hardError =
    (usePublicApi && Boolean(relatedError) && !publicApiHasNeighbors) ||
    (useConnectPapers &&
      Boolean(connectError) &&
      citedArticleIds.length > 0 &&
      !connectHasNeighbors);

  const relatedCount = Math.max(0, displayNodes.length - 1);
  const countLabel = useConnectPapers
    ? relatedCount > 0
      ? `${relatedCount} connected papers`
      : "Origin paper only — no citations in catalog"
    : relatedCount > 0
      ? `${relatedCount} related works`
      : "Origin paper only — no public-api neighbors";

  const openPaper = (paperId: string) => {
    setOpen(false);
    router.push(`/student/articles/${paperId}`);
  };

  return (
    <>
      <Card className="border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-heading text-lg text-foreground">
              Related works explorer
            </p>
            <p className="text-sm text-muted-foreground">
              {countLabel}
              {useConnectPapers ? " · built from catalog citations" : ""}
              . Open the full graph to inspect papers and jump to details.
            </p>
          </div>
        </div>
        <Button className="shrink-0" onClick={() => setOpen(true)}>
          Open graph
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[min(1240px,96vw)] w-full p-0 gap-0 overflow-hidden h-[min(860px,92vh)] max-h-[92vh] flex flex-col">
          <DialogHeader className="px-5 py-4 border-b border-border space-y-1 shrink-0 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Related works graph
            </DialogTitle>
            <DialogDescription>
              {countLabel}
              {useConnectPapers
                ? " · connect-papers source"
                : usePublicApi
                  ? " · public-api source"
                  : ""}
              . Click a node to inspect, then View article.
            </DialogDescription>
          </DialogHeader>

          {useConnectPapers && relatedCount === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30 shrink-0">
              No cited article IDs on this paper yet. Graph shows the origin
              paper only (source = {relatedWorksGraphSource}).
            </div>
          )}

          {hardError && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30 shrink-0">
              {relatedError ??
                (connectError instanceof Error
                  ? connectError.message
                  : null) ??
                "Could not load related works."}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-muted/20 shrink-0">
            {usePublicApi && hasMore && (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoadingMore}
                onClick={loadMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Load more
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_300px] flex-1 min-h-0 overflow-hidden">
            <aside className="border-b lg:border-b-0 lg:border-r border-border bg-card min-h-0 flex flex-col">
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border shrink-0">
                Papers
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <ul className="p-2 space-y-1">
                  {displayListPapers.map((paper) => {
                    const nodeId = `article:${paper.id}`;
                    const isOrigin = paper.id === articleId;
                    const isSelected = selectedId === nodeId;
                    return (
                      <li key={paper.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(nodeId)}
                          className={cn(
                            "w-full text-left rounded-lg px-3 py-2.5 transition-colors border border-transparent",
                            isSelected
                              ? "bg-primary/10 border-primary/30"
                              : "hover:bg-accent",
                          )}
                        >
                          {isOrigin && (
                            <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              <Sparkles className="w-3 h-3" />
                              Origin paper
                            </span>
                          )}
                          <div className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {paper.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {paper.authors.length > 0
                              ? paper.authors.slice(0, 2).join(", ")
                              : isDetailsLoading && isSparseGraphPaper(paper)
                                ? "Loading authors…"
                                : "Unknown authors"}
                            {paper.year != null ? ` · ${paper.year}` : ""}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </aside>

            <div className="relative bg-[radial-gradient(circle_at_center,hsl(var(--muted)/0.55),transparent_70%)] min-h-[320px] lg:min-h-0">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full h-full select-none"
                role="img"
                aria-label="Related works graph"
              >
                <g
                  transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${zoom}) translate(${-CENTER_X}, ${-CENTER_Y})`}
                >
                  {displayEdges.map((edge: ArticleGraphEdge) => {
                    const source = displayPositioned.get(edge.sourceId);
                    const target = displayPositioned.get(edge.targetId);
                    if (!source || !target) {
                      return null;
                    }
                    const touchesSelected =
                      edge.sourceId === selectedId ||
                      edge.targetId === selectedId;
                    return (
                      <line
                        key={edge.id}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        className={
                          touchesSelected
                            ? "stroke-primary/50"
                            : "stroke-muted-foreground/25"
                        }
                        strokeWidth={touchesSelected ? 1.8 : 1.1}
                      />
                    );
                  })}

                  {[...displayPositioned.values()].map((node) => {
                    const isRoot = node.id === rootNodeId;
                    const isSelected = node.id === selectedId;
                    const paperId = articleIdFromNodeId(node.id);
                    const paper = paperId ? papers[paperId] : null;
                    const label = shortAuthorLabel(
                      paper?.authors ?? [],
                      paper?.year ?? null,
                    );

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(node.id)}
                      >
                        {isSelected && (
                          <circle
                            r={node.radius + 7}
                            className="fill-none stroke-primary"
                            strokeWidth={2.5}
                          />
                        )}
                        <circle
                          r={node.radius}
                          className={
                            isRoot
                              ? "fill-primary"
                              : isSelected
                                ? "fill-primary/75"
                                : "fill-primary/45 hover:fill-primary/65"
                          }
                        />
                        <text
                          y={node.radius + 14}
                          textAnchor="middle"
                          className="fill-foreground/80 text-[10px] pointer-events-none"
                        >
                          {isRoot ? "Origin" : truncateLabel(label, 18)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setZoom((value) => Math.min(1.8, value + 0.15))
                  }
                  aria-label="Zoom in"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setZoom((value) => Math.max(0.7, value - 0.15))
                  }
                  aria-label="Zoom out"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>

              {isDetailsLoading && (
                <div className="absolute top-3 right-3 text-xs text-muted-foreground flex items-center gap-1.5 bg-card/90 px-2 py-1 rounded-md border border-border">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading details…
                </div>
              )}
            </div>

            <aside className="border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col min-h-0 overflow-hidden">
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border shrink-0">
                Selected paper
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  {selectedPaper || rootPaper ? (
                    <>
                      {(selectedPaper ?? rootPaper)!.id === articleId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          <Sparkles className="w-3 h-3" />
                          Origin paper
                        </span>
                      )}
                      <div className="space-y-2">
                        <h3 className="font-heading text-lg leading-snug text-foreground">
                          {(selectedPaper ?? rootPaper)!.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {(selectedPaper ?? rootPaper)!.authors.length > 0
                            ? (selectedPaper ?? rootPaper)!.authors.join(", ")
                            : isDetailsLoading &&
                                isSparseGraphPaper(selectedPaper ?? rootPaper)
                              ? "Loading authors…"
                              : "Unknown authors"}
                          {(selectedPaper ?? rootPaper)!.year != null
                            ? `, ${(selectedPaper ?? rootPaper)!.year}`
                            : ""}
                        </p>
                        {(selectedPaper ?? rootPaper)!.journal && (
                          <p className="text-xs text-muted-foreground">
                            {(selectedPaper ?? rootPaper)!.journal}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {(selectedPaper ?? rootPaper)!.citationCount} citations
                        </p>
                      </div>

                      {(selectedPaper ?? rootPaper)!.abstract && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Abstract
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {(selectedPaper ?? rootPaper)!.abstract}
                          </p>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        disabled={(selectedPaper ?? rootPaper)!.id === articleId}
                        onClick={() =>
                          openPaper((selectedPaper ?? rootPaper)!.id)
                        }
                      >
                        View article
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      {(selectedPaper ?? rootPaper)!.id === articleId && (
                        <p className="text-xs text-center text-muted-foreground">
                          You are already viewing this article.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Select a node to inspect the paper.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
