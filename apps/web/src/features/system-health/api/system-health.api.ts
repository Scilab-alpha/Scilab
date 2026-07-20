import { listArticles } from "@/features/experiments/api/articles.api";
import { listJournals } from "@/features/experiments/api/journals.api";
import { listAdminUsers } from "@/features/users/api/users.api";
import type { SystemHealthSnapshot } from "@/features/system-health/types/system-health.types";

type ProbeResult = {
  id: string;
  label: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  count?: number;
};

async function probe<T>(
  id: string,
  label: string,
  run: () => Promise<{ count?: number; value?: T }>,
): Promise<ProbeResult> {
  const started = performance.now();
  try {
    const result = await run();
    return {
      id,
      label,
      ok: true,
      durationMs: Math.round(performance.now() - started),
      count: result.count,
    };
  } catch (error) {
    return {
      id,
      label,
      ok: false,
      durationMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Probe failed",
    };
  }
}

/** Live admin health snapshot from SciLab API probes (no dedicated health endpoint). */
export async function fetchSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const [journals, articles, users] = await Promise.all([
    probe("journals", "Academic journals", async () => {
      const page = await listJournals({ limit: 50 });
      return { count: page.items.length };
    }),
    probe("articles", "Academic articles", async () => {
      const page = await listArticles({ limit: 50 });
      return { count: page.items.length };
    }),
    probe("users", "User directory", async () => {
      const list = await listAdminUsers();
      return { count: list.length };
    }),
  ]);

  const probes = [journals, articles, users];
  const failed = probes.filter((probeResult) => !probeResult.ok);
  const overallStatus =
    failed.length === 0
      ? "operational"
      : failed.length === probes.length
        ? "incident"
        : "degraded";

  const journalCount = journals.count ?? 0;
  const articleCount = articles.count ?? 0;
  const userCount = users.count ?? 0;

  const now = new Date().toISOString();

  return {
    metrics: [
      {
        id: "journals",
        label: "Journals (sample)",
        value: journalCount,
        change: 0,
        trend: "up",
      },
      {
        id: "articles",
        label: "Articles (sample)",
        value: articleCount,
        change: 0,
        trend: "up",
      },
      {
        id: "authors",
        label: "Users",
        value: userCount,
        change: 0,
        trend: "up",
      },
      {
        id: "keywords",
        label: "API latency (ms)",
        value: Math.round(
          probes.reduce((sum, row) => sum + row.durationMs, 0) / probes.length,
        ),
        change: 0,
        trend: "down",
      },
    ],
    syncJobs: probes.map((probeResult) => ({
      id: probeResult.id,
      source: probeResult.label,
      lastSyncTime: now,
      status: probeResult.ok ? "success" : "failed",
      recordsUpdated: probeResult.count ?? 0,
      durationMs: probeResult.durationMs,
    })),
    errorLogs: failed.map((probeResult, index) => ({
      id: `err-${probeResult.id}-${index}`,
      timestamp: now,
      severity: "critical" as const,
      service: probeResult.label,
      message: probeResult.error ?? "Request failed",
    })),
    recentFailures: failed.map((probeResult, index) => ({
      id: `fail-${probeResult.id}-${index}`,
      timestamp: now,
      severity: "warning" as const,
      service: probeResult.label,
      message: probeResult.error ?? "Request failed",
    })),
    apiFailures: failed.map((probeResult, index) => ({
      id: `api-${probeResult.id}-${index}`,
      provider: "SciLab API",
      endpoint: probeResult.id,
      statusCode: 0,
      timestamp: now,
      message: probeResult.error ?? "Request failed",
    })),
    syncPerformance: probes.map((probeResult) => ({
      time: probeResult.label,
      records: probeResult.count ?? 0,
      duration: probeResult.durationMs,
    })),
    dataGrowth: [
      {
        month: "Sample",
        journals: journalCount,
        articles: articleCount,
        authors: userCount,
      },
    ],
    apiAvailability: [
      {
        hour: "Now",
        openalex: journals.ok && articles.ok ? 100 : 40,
        crossref: 0,
        semanticScholar: 0,
      },
    ],
    overallStatus,
    uptimePercent:
      probes.length === 0
        ? 0
        : Math.round(((probes.length - failed.length) / probes.length) * 1000) /
          10,
  };
}
