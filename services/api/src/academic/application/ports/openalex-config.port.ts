export interface OpenAlexConfigReader {
  getSyncConfig(): OpenAlexSyncConfig;
}

export interface OpenAlexSyncConfig {
  apiKey?: string;
  baseUrl: string;
  filter?: string;
  sort?: string;
  perPage: number;
}
