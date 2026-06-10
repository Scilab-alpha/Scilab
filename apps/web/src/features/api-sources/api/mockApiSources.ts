import type { ApiSource } from "../types/api-source.types";

export const mockApiSources: ApiSource[] = [
  {
    id: "src-openalex",
    providerId: "openalex",
    name: "OpenAlex",
    description: "Open catalog of scholarly papers, authors, institutions, and concepts.",
    endpoint: "https://api.openalex.org",
    status: "active",
    connectionHealth: "healthy",
    lastSync: "2026-06-08T17:45:00Z",
    apiKeyConfigured: false,
  },
  {
    id: "src-semantic-scholar",
    providerId: "semantic-scholar",
    name: "Semantic Scholar",
    description: "AI-powered scientific literature graph and citation metadata.",
    endpoint: "https://api.semanticscholar.org/graph/v1",
    status: "active",
    connectionHealth: "healthy",
    lastSync: "2026-06-08T17:30:00Z",
    apiKeyConfigured: true,
  },
  {
    id: "src-crossref",
    providerId: "crossref",
    name: "Crossref",
    description: "DOI registration agency metadata for journals and publications.",
    endpoint: "https://api.crossref.org",
    status: "active",
    connectionHealth: "degraded",
    lastSync: "2026-06-08T14:12:00Z",
    apiKeyConfigured: true,
  },
  {
    id: "src-scimago",
    providerId: "scimago",
    name: "SCImago",
    description: "Journal rankings, SJR metrics, and country-level analytics.",
    endpoint: "https://www.scimagojr.com/api",
    status: "disabled",
    connectionHealth: "unknown",
    lastSync: "2026-05-28T09:00:00Z",
    apiKeyConfigured: false,
  },
];

export const PROVIDER_PRESETS = [
  {
    id: "openalex" as const,
    name: "OpenAlex",
    endpoint: "https://api.openalex.org",
    description: "Open catalog of scholarly papers, authors, institutions, and concepts.",
  },
  {
    id: "semantic-scholar" as const,
    name: "Semantic Scholar",
    endpoint: "https://api.semanticscholar.org/graph/v1",
    description: "AI-powered scientific literature graph and citation metadata.",
  },
  {
    id: "crossref" as const,
    name: "Crossref",
    endpoint: "https://api.crossref.org",
    description: "DOI registration agency metadata for journals and publications.",
  },
  {
    id: "scimago" as const,
    name: "SCImago",
    endpoint: "https://www.scimagojr.com/api",
    description: "Journal rankings, SJR metrics, and country-level analytics.",
  },
];
