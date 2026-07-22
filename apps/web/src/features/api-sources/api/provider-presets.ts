export const PROVIDER_PRESETS = [
  {
    id: "openalex" as const,
    name: "OpenAlex",
    endpoint: "https://api.openalex.org",
    description:
      "Open catalog of scholarly papers, authors, institutions, and concepts.",
  },
  {
    id: "semantic-scholar" as const,
    name: "Semantic Scholar",
    endpoint: "https://api.semanticscholar.org/graph/v1",
    description:
      "AI-powered scientific literature graph and citation metadata.",
  },
  {
    id: "crossref" as const,
    name: "Crossref",
    endpoint: "https://api.crossref.org",
    description:
      "DOI registration agency metadata for journals and publications.",
  },
  {
    id: "scimago" as const,
    name: "SCImago",
    endpoint: "https://www.scimagojr.com/api",
    description: "Journal rankings, SJR metrics, and country-level analytics.",
  },
];
