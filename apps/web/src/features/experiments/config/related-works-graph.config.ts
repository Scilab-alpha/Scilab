/**
 * Related Works Graph data source.
 *
 * - `public-api` — GET /academic/graphs/article/:id (preferred; real RELATED_TO neighbors)
 * - `connect-papers` — build the graph from cited articles already in the catalog
 */
export const RELATED_WORKS_GRAPH_SOURCE = {
  CONNECT_PAPERS: "connect-papers",
  PUBLIC_API: "public-api",
} as const;

export type RelatedWorksGraphSource =
  (typeof RELATED_WORKS_GRAPH_SOURCE)[keyof typeof RELATED_WORKS_GRAPH_SOURCE];

const SOURCE_VALUES = new Set<string>(Object.values(RELATED_WORKS_GRAPH_SOURCE));

function resolveRelatedWorksGraphSource(
  value = process.env.NEXT_PUBLIC_RELATED_WORKS_GRAPH_SOURCE,
): RelatedWorksGraphSource {
  const normalized = value?.trim().toLowerCase();
  if (normalized && SOURCE_VALUES.has(normalized)) {
    return normalized as RelatedWorksGraphSource;
  }

  // Prefer the live article-graph endpoint (many RELATED_TO neighbors).
  return RELATED_WORKS_GRAPH_SOURCE.PUBLIC_API;
}

/** Active graph source — default uses the public article graph API. */
export const relatedWorksGraphSource = resolveRelatedWorksGraphSource();

export function isConnectPapersSource(
  source = relatedWorksGraphSource,
): boolean {
  return source === RELATED_WORKS_GRAPH_SOURCE.CONNECT_PAPERS;
}

export function isPublicApiGraphSource(
  source = relatedWorksGraphSource,
): boolean {
  return source === RELATED_WORKS_GRAPH_SOURCE.PUBLIC_API;
}
