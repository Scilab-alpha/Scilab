import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import { listAdminJobs, listAdminSyncLogs } from "./system-health.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("system-health.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads jobs and paginated sync logs from admin endpoints", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);

    await listAdminJobs();
    await listAdminSyncLogs({ page: 3, pageSize: 20 });

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      authenticated: true,
      method: "GET",
      path: "/admin/jobs",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      authenticated: true,
      method: "GET",
      path: "/admin/sync-logs?page=3&pageSize=20",
    });
  });
});
