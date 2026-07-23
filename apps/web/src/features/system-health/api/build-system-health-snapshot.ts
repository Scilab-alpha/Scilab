import type {
  AdminDashboardMetrics,
  AdminPipelineJob,
  AdminSyncLog,
} from "@/features/system-health/types/admin-sync.types";
import type {
  PlatformMetric,
  SyncJob,
  SyncPerformancePoint,
  SyncStatus,
  SystemHealthSnapshot,
} from "@/features/system-health/types/system-health.types";

function mapApiSyncStatus(status: string): SyncStatus {
  switch (status.toUpperCase()) {
    case "RUNNING":
      return "running";
    case "SUCCESS":
      return "success";
    case "PARTIAL":
      return "delayed";
    case "FAILED":
    case "CANCELLED":
      return "failed";
    default:
      return "delayed";
  }
}

function durationMs(log: AdminSyncLog) {
  if (!log.finishedAt) return 0;
  const start = new Date(log.startedAt).getTime();
  const end = new Date(log.finishedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return end - start;
}

function recordsUpdated(log: AdminSyncLog) {
  return (
    (log.insertedCount ?? log.totalInserted ?? 0) +
    (log.updatedCount ?? log.totalUpdated ?? 0)
  );
}

/** Map live admin dashboard (+ optional recent logs) into the System Health view model. */
export function buildSystemHealthSnapshot(input: {
  dashboard: AdminDashboardMetrics;
  jobs?: AdminPipelineJob[];
  syncLogs?: AdminSyncLog[];
}): SystemHealthSnapshot {
  const { dashboard, jobs = [] } = input;
  const syncLogs =
    input.syncLogs && input.syncLogs.length > 0
      ? input.syncLogs
      : (dashboard.sync.recentLogs ?? []);
  const failedLogs = syncLogs.filter((log) =>
    ["FAILED", "CANCELLED"].includes(log.status.toUpperCase()),
  );

  const overallStatus =
    dashboard.sync.failedSyncCountLast24Hours > 5 || failedLogs.length > 3
      ? "incident"
      : dashboard.sync.failedSyncCountLast24Hours > 0 ||
          dashboard.sync.runningJobCount > 3
        ? "degraded"
        : "operational";

  const metrics: PlatformMetric[] = [
    {
      id: "journals",
      label: "Journals",
      value: dashboard.journalCount,
      change: dashboard.growth.last7Days.journals,
      trend: dashboard.growth.last7Days.journals >= 0 ? "up" : "down",
    },
    {
      id: "articles",
      label: "Articles",
      value: dashboard.articleCount,
      change: dashboard.growth.last7Days.articles,
      trend: dashboard.growth.last7Days.articles >= 0 ? "up" : "down",
    },
    {
      id: "authors",
      label: "Authors",
      value: dashboard.authorCount,
      change: dashboard.growth.last7Days.authorsWithNewArticles,
      trend:
        dashboard.growth.last7Days.authorsWithNewArticles >= 0 ? "up" : "down",
    },
    {
      id: "users",
      label: "Users",
      value: dashboard.userCount,
      change: dashboard.users.registrations.last7Days,
      trend: dashboard.users.registrations.last7Days >= 0 ? "up" : "down",
    },
  ];

  const syncJobsFromLogs: SyncJob[] = syncLogs.slice(0, 20).map((log) => ({
    id: log.id,
    source: log.sourceName || log.source,
    lastSyncTime: log.finishedAt ?? log.startedAt,
    status: mapApiSyncStatus(log.status),
    recordsUpdated: recordsUpdated(log),
    durationMs: durationMs(log),
  }));

  const syncJobsFromPipeline: SyncJob[] = jobs.map((job) => ({
    id: `job-${job.id}`,
    source: job.displayName || job.name || String(job.id),
    lastSyncTime: job.lastRunAt ?? dashboard.generatedAt,
    status: job.paused || job.isPaused
      ? "delayed"
      : mapApiSyncStatus(String(job.status ?? job.lastStatus ?? "SUCCESS")),
    recordsUpdated: job.runningCount ?? 0,
    durationMs: 0,
  }));

  const syncPerformance: SyncPerformancePoint[] = syncLogs
    .slice(0, 12)
    .reverse()
    .map((log) => ({
      time: new Date(log.startedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      records: recordsUpdated(log),
      duration: Math.round(durationMs(log) / 1000),
    }));

  return {
    metrics,
    syncJobs:
      syncJobsFromLogs.length > 0 ? syncJobsFromLogs : syncJobsFromPipeline,
    errorLogs: failedLogs.slice(0, 20).map((log) => ({
      id: `err-${log.id}`,
      timestamp: log.finishedAt ?? log.startedAt,
      severity: "critical" as const,
      service: log.sourceName || log.source,
      message:
        log.errorDetail?.trim() ||
        `${log.jobType} ended with status ${log.status}`,
    })),
    recentFailures: failedLogs.slice(0, 10).map((log) => ({
      id: `fail-${log.id}`,
      timestamp: log.finishedAt ?? log.startedAt,
      severity: "warning" as const,
      service: log.jobType,
      message:
        log.errorDetail?.trim() ||
        `${log.source} · ${log.status} · errors=${log.errorCount ?? log.totalErrors ?? 0}`,
    })),
    apiFailures: dashboard.sources
      .filter((source) => source.failedSyncCountLast24Hours > 0)
      .map((source) => ({
        id: source.id,
        provider: source.name,
        endpoint: source.latestSyncStatus ?? "sync",
        statusCode: 0,
        timestamp: source.latestSyncAt ?? dashboard.generatedAt,
        message: `${source.failedSyncCountLast24Hours} failed sync(s) in last 24h`,
      })),
    syncPerformance:
      syncPerformance.length > 0
        ? syncPerformance
        : [
            {
              time: "—",
              records: 0,
              duration: 0,
            },
          ],
    dataGrowth: [
      {
        month: "Last 7d",
        journals: dashboard.growth.last7Days.journals,
        articles: dashboard.growth.last7Days.articles,
        authors: dashboard.growth.last7Days.authorsWithNewArticles,
      },
      {
        month: "Last 30d",
        journals: dashboard.growth.last30Days.journals,
        articles: dashboard.growth.last30Days.articles,
        authors: dashboard.growth.last30Days.authorsWithNewArticles,
      },
    ],
    apiAvailability: dashboard.sources.map((source) => ({
      name: source.name,
      active: source.isActive,
      health: source.isActive
        ? Math.max(0, 100 - source.failedSyncCountLast24Hours * 10)
        : 0,
    })),
    overallStatus,
    uptimePercent: Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            dashboard.sync.failedSyncCountLast24Hours * 4 -
            dashboard.sync.runningJobCount,
        ),
      ),
    ),
  };
}
