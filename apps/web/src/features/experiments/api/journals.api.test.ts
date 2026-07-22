import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import {
  buildJournalRankingQuery,
  listJournalRankings,
  listJournals,
} from "./journals.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("journals.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({ items: [], nextCursor: null });
  });

  it("lists journals with only cursor and limit", async () => {
    await listJournals({ cursor: "journal/cursor", limit: 24 });
    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/academic/journals?limit=24&cursor=journal%2Fcursor",
    });
  });

  it("requires an exact configured year for SCImago rankings", async () => {
    expect(
      buildJournalRankingQuery({ year: 2025, cursor: "28773", limit: 20 }),
    ).toBe("year=2025&limit=20&cursor=28773");

    await listJournalRankings({ year: 2024, limit: 20 });
    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/academic/journal-rankings?year=2024&limit=20",
    });
  });
});
