import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getJobs } from "@/app/api/admin/jobs/route";
import { GET as getSyncLogs } from "@/app/api/admin/sync-logs/route";
import { proxyAuthenticated } from "@/features/auth/server/auth-bff";

vi.mock("@/features/auth/server/auth-bff", () => ({
  proxyAuthenticated: vi.fn(() => Response.json({ success: true })),
}));

describe("admin health BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards jobs and preserves sync-log query parameters", async () => {
    const jobsRequest = new NextRequest("https://web.example/api/admin/jobs");
    await getJobs(jobsRequest);
    expect(proxyAuthenticated).toHaveBeenNthCalledWith(
      1,
      jobsRequest,
      "admin/jobs",
    );

    const logsRequest = new NextRequest(
      "https://web.example/api/admin/sync-logs?page=2&pageSize=20",
    );
    await getSyncLogs(logsRequest);
    expect(proxyAuthenticated).toHaveBeenNthCalledWith(
      2,
      logsRequest,
      "admin/sync-logs?page=2&pageSize=20",
    );
  });
});
