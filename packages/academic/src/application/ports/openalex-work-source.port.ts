import {
  OpenAlexConfig,
  OpenAlexWorksQueryConfig,
} from '@repo/academic/application/ports/openalex-config.port';

export interface FetchOpenAlexWorksInput {
  config: OpenAlexWorksQueryConfig;
  cursor?: string | null;
}

export interface FetchOpenAlexWorksByIdsInput {
  config: OpenAlexConfig;
  ids: string[];
}

export interface FetchOpenAlexCitingWorksInput {
  config: OpenAlexConfig;
  workId: string;
  limit: number;
}

export interface OpenAlexWorksPage {
  meta?: {
    count?: number;
    page?: number;
    per_page?: number;
    next_cursor?: string | null;
  };
  results: OpenAlexWorkRecord[];
}

export interface OpenAlexWorkSource {
  fetchWorks(input: FetchOpenAlexWorksInput): Promise<OpenAlexWorksPage>;
  fetchWorksByIds(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage>;
  fetchRelatedWorksByIds?(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage>;
  fetchWorkDetailsByIds?(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage>;
  fetchCitingWorks?(
    input: FetchOpenAlexCitingWorksInput,
  ): Promise<OpenAlexWorksPage>;
}

export interface OpenAlexWorkRecord {
  id?: string | null;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  cited_by_count?: number | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  type?: string | null;
  version?: string | null;
  biblio?: {
    volume?: string | null;
    issue?: string | null;
  } | null;
  created_date?: string | null;
  updated_date?: string | null;
  primary_location?: OpenAlexLocationRecord | null;
  open_access?: {
    is_oa?: boolean | null;
  } | null;
  authorships?: OpenAlexAuthorshipRecord[] | null;
  keywords?: OpenAlexScoredEntityRecord[] | null;
  topics?: OpenAlexTopicRecord[] | null;
  primary_topic?: OpenAlexTopicRecord | null;
  referenced_works?: string[] | null;
  related_works?: string[] | null;
}

export interface OpenAlexLocationRecord {
  is_oa?: boolean | null;
  source?: OpenAlexSourceRecord | null;
}

export interface OpenAlexSourceRecord {
  id?: string | null;
  display_name?: string | null;
  type?: string | null;
  issn_l?: string | null;
  issn?: string[] | null;
  host_organization_name?: string | null;
  publisher?: string | null;
  country_code?: string | null;
}

export interface OpenAlexAuthorshipRecord {
  author_position?: string | null;
  author?: {
    id?: string | null;
    orcid?: string | null;
    display_name?: string | null;
  } | null;
}

export interface OpenAlexScoredEntityRecord {
  id?: string | null;
  display_name?: string | null;
  score?: number | null;
}

export interface OpenAlexTopicRecord extends OpenAlexScoredEntityRecord {
  field?: {
    display_name?: string | null;
  } | null;
  domain?: {
    display_name?: string | null;
  } | null;
}
