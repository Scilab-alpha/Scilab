import { OpenAlexConfig } from '@/academic/application/ports/openalex-config.port';

export interface OpenAlexJournalSourceRecord {
  id?: string | null;
  display_name?: string | null;
  type?: string | null;
  issn_l?: string | null;
  issn?: string[] | null;
  is_oa?: boolean | null;
  is_oa_diamond?: boolean | null;
  host_organization_name?: string | null;
  publisher?: string | null;
  country_code?: string | null;
}

export interface OpenAlexSourcesPage {
  results: OpenAlexJournalSourceRecord[];
}

export interface OpenAlexSourcesCatalog {
  fetchSourcesByIssns(input: {
    config: OpenAlexConfig;
    issns: string[];
  }): Promise<OpenAlexSourcesPage>;
}

export const OPENALEX_SOURCES_CATALOG = Symbol('OPENALEX_SOURCES_CATALOG');
