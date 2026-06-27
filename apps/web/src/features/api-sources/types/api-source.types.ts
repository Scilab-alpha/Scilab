export type ApiSourceStatus = "active" | "disabled" | "error";

export type ConnectionHealth = "healthy" | "degraded" | "down" | "unknown";

export type ApiProviderId =
  | "openalex"
  | "semantic-scholar"
  | "crossref"
  | "scimago"
  | "custom";

export interface ApiSource {
  id: string;
  providerId: ApiProviderId;
  name: string;
  description: string;
  endpoint: string;
  status: ApiSourceStatus;
  connectionHealth: ConnectionHealth;
  lastSync: string | null;
  apiKeyConfigured: boolean;
}

export interface ApiSourceFormValues {
  name: string;
  providerId: ApiProviderId;
  endpoint: string;
  description: string;
  apiKey: string;
}
