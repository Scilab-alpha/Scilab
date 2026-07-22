import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SystemHealthDashboard from "./SystemHealthDashboard";
import { useSystemHealth } from "../hooks/use-system-health";

vi.mock("../hooks/use-system-health", () => ({ useSystemHealth: vi.fn() }));

describe("SystemHealthDashboard", () => {
  it("renders backend jobs and sync logs while marking unsupported metrics unavailable", () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      jobs: [
        {
          id: "job-1",
          name: "OpenAlex journal sync",
          queueName: "academic",
          dataType: "JOURNAL",
          source: "OPENALEX",
          cron: "0 * * * *",
          timeZone: "UTC",
          schedulerStatus: "active",
          status: "running",
          progress: { current: 5, total: 10, percentage: 50, message: null },
          lastError: null,
          lastRunAt: "2026-07-22T01:00:00.000Z",
          nextRunAt: "2026-07-22T02:00:00.000Z",
          pausedAt: null,
        },
      ],
      logs: {
        items: [
          {
            id: "log-1",
            source: "OPENALEX",
            dataType: "JOURNAL",
            status: "success",
            startedAt: "2026-07-22T01:00:00.000Z",
            finishedAt: "2026-07-22T01:05:00.000Z",
            successCount: 42,
            failureCount: 0,
            errorDetail: null,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      },
      jobsLoading: false,
      logsLoading: false,
      jobsError: null,
      logsError: null,
      isFetching: false,
      reload: vi.fn(),
    });

    render(<SystemHealthDashboard />);

    expect(screen.getByText("OpenAlex journal sync")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(
      screen.getByRole("status", {
        name: "Health history and provider availability unavailable",
      }),
    ).toHaveTextContent("API not available");
  });
});
