import { apiRequest } from "@/core/api";
import type {
  AdminAcademicJob,
  AdminSyncLogPage,
  AdminSyncLogParams,
} from "@/features/system-health/types/system-health.types";

export function listAdminJobs(): Promise<AdminAcademicJob[]> {
  return apiRequest<AdminAcademicJob[]>({
    authenticated: true,
    method: "GET",
    path: "/admin/jobs",
  });
}

export function listAdminSyncLogs(
  params: AdminSyncLogParams = {},
): Promise<AdminSyncLogPage> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  });

  return apiRequest<AdminSyncLogPage>({
    authenticated: true,
    method: "GET",
    path: `/admin/sync-logs?${query.toString()}`,
  });
}
