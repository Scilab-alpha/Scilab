import { listArticles } from "@/features/experiments/api/articles.api";
import { listJournals } from "@/features/experiments/api/journals.api";
import { apiConfig } from "@/core/api/config";
import type {
  ApiSource,
  ApiSourceStatus,
  ConnectionHealth,
} from "@/features/api-sources/types/api-source.types";

const SOURCE_STATE_KEY = "scilab_admin_api_source_state";

type StoredSourceState = Record<
  string,
  { status?: ApiSourceStatus; lastSync?: string | null }
>;

function readStoredState(): StoredSourceState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SOURCE_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredSourceState;
  } catch {
    return {};
  }
}

function writeStoredState(state: StoredSourceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOURCE_STATE_KEY, JSON.stringify(state));
}

async function probeOk(run: () => Promise<unknown>): Promise<{
  ok: boolean;
  checkedAt: string;
}> {
  const checkedAt = new Date().toISOString();
  try {
    await run();
    return { ok: true, checkedAt };
  } catch {
    return { ok: false, checkedAt };
  }
}

/** Live connection status for configured academic data sources. */
export async function listApiSources(): Promise<ApiSource[]> {
  const stored = readStoredState();
  const [journalsProbe, articlesProbe] = await Promise.all([
    probeOk(() => listJournals({ limit: 1 })),
    probeOk(() => listArticles({ limit: 1 })),
  ]);

  const academicHealthy = journalsProbe.ok && articlesProbe.ok;
  const academicHealth: ConnectionHealth = academicHealthy
    ? "healthy"
    : journalsProbe.ok || articlesProbe.ok
      ? "degraded"
      : "down";

  const defaults: ApiSource[] = [
    {
      id: "scilab-academic",
      providerId: "openalex",
      name: "SciLab Academic API",
      description:
        "Journal & article catalog served by SciLab (OpenAlex-backed graph).",
      endpoint: `${apiConfig.publicApiUrl}/academic`,
      status: stored["scilab-academic"]?.status ?? "active",
      connectionHealth:
        stored["scilab-academic"]?.status === "disabled"
          ? "unknown"
          : academicHealth,
      lastSync: articlesProbe.checkedAt,
      apiKeyConfigured: true,
    },
    {
      id: "openalex-public",
      providerId: "openalex",
      name: "OpenAlex",
      description:
        "Upstream scholarly graph used by the academic crawl pipeline.",
      endpoint: "https://api.openalex.org",
      status: stored["openalex-public"]?.status ?? "active",
      connectionHealth:
        stored["openalex-public"]?.status === "disabled"
          ? "unknown"
          : academicHealthy
            ? "healthy"
            : "degraded",
      lastSync: journalsProbe.checkedAt,
      apiKeyConfigured: false,
    },
    {
      id: "scimago",
      providerId: "scimago",
      name: "SCImago Journal Rank",
      description: "Journal ranking catalog ingested by the academic pipeline.",
      endpoint: "SCImago dataset (filesystem / ranking sync)",
      status: stored["scimago"]?.status ?? "active",
      connectionHealth:
        stored["scimago"]?.status === "disabled" ? "unknown" : "healthy",
      lastSync: stored["scimago"]?.lastSync ?? null,
      apiKeyConfigured: false,
    },
  ];

  return defaults;
}

export function updateApiSourceStatus(
  sourceId: string,
  status: ApiSourceStatus,
) {
  const stored = readStoredState();
  stored[sourceId] = {
    ...stored[sourceId],
    status,
    lastSync: new Date().toISOString(),
  };
  writeStoredState(stored);
}

export async function refreshApiSource(sourceId: string): Promise<ApiSource[]> {
  const stored = readStoredState();
  stored[sourceId] = {
    ...stored[sourceId],
    lastSync: new Date().toISOString(),
  };
  writeStoredState(stored);
  return listApiSources();
}
