import { getAdminDashboardMetrics } from "@/features/system-health/api/admin-sync.api";
import { buildSystemHealthSnapshot } from "@/features/system-health/api/build-system-health-snapshot";
import type { SystemHealthSnapshot } from "@/features/system-health/types/system-health.types";

/**
 * Overview from GET /admin/dashboard only.
 * Jobs + sync-log tables load in their own panels so the page is not blocked by slower list APIs.
 */
export async function fetchSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const dashboard = await getAdminDashboardMetrics();
  return buildSystemHealthSnapshot({
    dashboard,
    syncLogs: dashboard.sync.recentLogs ?? [],
  });
}
