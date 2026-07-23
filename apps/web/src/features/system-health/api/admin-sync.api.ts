import { apiRequest } from "@/core/api";
import type {
  AdminDashboardMetrics,
  AdminJobActionBody,
  AdminJobsListData,
  AdminPipelineJob,
  AdminPipelineJobId,
  AdminSyncLog,
  AdminSyncLogListParams,
  AdminSyncLogsPage,
} from "@/features/system-health/types/admin-sync.types";

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value?: string | number | null,
) {
  if (value == null) return;
  const normalized = String(value).trim();
  if (normalized) params.set(key, normalized);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

export function normalizeSyncLog(raw: unknown): AdminSyncLog | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string") return null;

  return {
    id: row.id,
    source: asString(row.source, "UNKNOWN"),
    jobType: asString(row.jobType ?? row.dataType, "UNKNOWN"),
    status: asString(row.status, "UNKNOWN"),
    startedAt: asString(row.startedAt, new Date(0).toISOString()),
    finishedAt: asNullableString(row.finishedAt),
    insertedCount: asNumber(
      row.insertedCount ?? row.totalInserted,
      asNumber(row.totalInserted),
    ),
    updatedCount: asNumber(
      row.updatedCount ?? row.totalUpdated,
      asNumber(row.totalUpdated),
    ),
    errorCount: asNumber(
      row.errorCount ?? row.totalErrors,
      asNumber(row.totalErrors),
    ),
    totalFetched: asNumber(row.totalFetched),
    totalInserted: asNumber(row.totalInserted ?? row.insertedCount),
    totalUpdated: asNumber(row.totalUpdated ?? row.updatedCount),
    totalErrors: asNumber(row.totalErrors ?? row.errorCount),
    sourceName: asString(row.sourceName, asString(row.source)),
    errorDetail: asNullableString(row.errorDetail),
    configId: typeof row.configId === "string" ? row.configId : undefined,
  };
}

export function normalizeSyncLogsPage(raw: unknown): AdminSyncLogsPage {
  const data = asRecord(raw) ?? {};
  const listCandidate =
    data.items ?? data.logs ?? data.results ?? (Array.isArray(raw) ? raw : []);
  const items = Array.isArray(listCandidate)
    ? listCandidate
        .map((item) => normalizeSyncLog(item))
        .filter((item): item is AdminSyncLog => Boolean(item))
    : [];

  const page = asNumber(data.page ?? data.currentPage, 1);
  const pageSize = asNumber(data.pageSize ?? data.limit, items.length || 20);
  const total = asNumber(
    data.total ?? data.totalItems ?? data.totalCount,
    items.length,
  );

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: asNumber(
      data.totalPages,
      Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    ),
  };
}

export function normalizePipelineJob(raw: unknown): AdminPipelineJob | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = asString(row.id ?? row.jobId ?? row.name);
  if (!id) return null;

  return {
    id,
    name: asString(row.name ?? row.displayName, id),
    displayName: asString(row.displayName ?? row.name, id),
    description:
      typeof row.description === "string" ? row.description : undefined,
    status: asString(row.status ?? row.state ?? row.lastStatus, "unknown"),
    state: typeof row.state === "string" ? row.state : undefined,
    paused: Boolean(row.paused ?? row.isPaused),
    isPaused: Boolean(row.isPaused ?? row.paused),
    enabled: row.enabled == null ? undefined : Boolean(row.enabled),
    lastRunAt: asNullableString(row.lastRunAt ?? row.lastSyncAt),
    nextRunAt: asNullableString(row.nextRunAt),
    lastStatus: asNullableString(row.lastStatus ?? row.status),
    runningCount: asNumber(row.runningCount),
    waitingCount: asNumber(row.waitingCount),
    failedCount: asNumber(row.failedCount),
    queue: typeof row.queue === "string" ? row.queue : undefined,
    scheduler: typeof row.scheduler === "string" ? row.scheduler : undefined,
  };
}

export function normalizeJobsList(raw: unknown): AdminPipelineJob[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizePipelineJob(item))
      .filter((item): item is AdminPipelineJob => Boolean(item));
  }

  const data = asRecord(raw) as AdminJobsListData | null;
  const list = data?.jobs ?? data?.items ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizePipelineJob(item))
    .filter((item): item is AdminPipelineJob => Boolean(item));
}

/** GET /admin/dashboard */
export function getAdminDashboardMetrics() {
  return apiRequest<AdminDashboardMetrics>({
    authenticated: true,
    method: "GET",
    path: "/admin/dashboard",
  });
}

/** GET /admin/sync-logs */
export async function listAdminSyncLogs(
  params: AdminSyncLogListParams = {},
): Promise<AdminSyncLogsPage> {
  const query = new URLSearchParams();
  setOptionalParam(query, "page", params.page);
  setOptionalParam(query, "pageSize", params.pageSize);
  setOptionalParam(query, "source", params.source || undefined);
  setOptionalParam(query, "dataType", params.dataType || undefined);
  setOptionalParam(query, "status", params.status || undefined);
  setOptionalParam(query, "startedFrom", params.startedFrom);
  setOptionalParam(query, "startedTo", params.startedTo);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest<unknown>({
    authenticated: true,
    method: "GET",
    path: `/admin/sync-logs${suffix}`,
  });
  return normalizeSyncLogsPage(data);
}

/** GET /admin/sync-logs/:id */
export async function getAdminSyncLog(id: string): Promise<AdminSyncLog> {
  const data = await apiRequest<unknown>({
    authenticated: true,
    method: "GET",
    path: `/admin/sync-logs/${encodeURIComponent(id)}`,
  });
  const normalized = normalizeSyncLog(data);
  if (!normalized) {
    throw new Error("Sync log response was empty or invalid.");
  }
  return normalized;
}

/** GET /admin/jobs */
export async function listAdminJobs(): Promise<AdminPipelineJob[]> {
  const data = await apiRequest<unknown>({
    authenticated: true,
    method: "GET",
    path: "/admin/jobs",
  });
  return normalizeJobsList(data);
}

/** GET /admin/jobs/:id */
export async function getAdminJob(
  jobId: AdminPipelineJobId | string,
): Promise<AdminPipelineJob> {
  const data = await apiRequest<unknown>({
    authenticated: true,
    method: "GET",
    path: `/admin/jobs/${encodeURIComponent(jobId)}`,
  });
  const normalized = normalizePipelineJob(data);
  if (!normalized) {
    throw new Error("Job response was empty or invalid.");
  }
  return normalized;
}

async function postJobAction(
  jobId: AdminPipelineJobId | string,
  action: "pause" | "resume" | "trigger" | "cancel" | "retry",
  body: AdminJobActionBody = {},
) {
  return apiRequest<unknown>({
    authenticated: true,
    method: "POST",
    path: `/admin/jobs/${encodeURIComponent(jobId)}/${action}`,
    body,
  });
}

export const pauseAdminJob = (
  jobId: AdminPipelineJobId | string,
  body?: AdminJobActionBody,
) => postJobAction(jobId, "pause", body);

export const resumeAdminJob = (
  jobId: AdminPipelineJobId | string,
  body?: AdminJobActionBody,
) => postJobAction(jobId, "resume", body);

export const triggerAdminJob = (
  jobId: AdminPipelineJobId | string,
  body?: AdminJobActionBody,
) => postJobAction(jobId, "trigger", body);

export const cancelAdminJob = (
  jobId: AdminPipelineJobId | string,
  body?: AdminJobActionBody,
) => postJobAction(jobId, "cancel", body);

export const retryAdminJob = (
  jobId: AdminPipelineJobId | string,
  body?: AdminJobActionBody,
) => postJobAction(jobId, "retry", body);
