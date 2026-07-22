import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JournalRankingTable } from "./AdvancedDashboard";
import { useJournalRankings } from "@/features/laboratories/hooks/use-journal-rankings";
import type { JournalRankingItem } from "@/features/experiments/types/journal.types";

vi.mock("@/features/laboratories/hooks/use-journal-rankings", () => ({
  useJournalRankings: vi.fn(),
}));

describe("JournalRankingTable", () => {
  it("renders exact API metrics and only links matched journals", async () => {
    vi.mocked(useJournalRankings).mockReturnValue({
      pages: [
        {
          items: [
            rankingItem({
              scimagoSourceId: "1",
              journalId: "S1",
              title: "Matched journal",
              matchStatus: "MATCHED",
              sjr: 10.5,
            }),
            rankingItem({
              scimagoSourceId: "2",
              journalId: null,
              title: "Unmatched journal",
              matchStatus: "UNMATCHED",
              sjr: null,
            }),
          ],
          nextCursor: null,
        },
      ],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
      loadMore: vi.fn(),
      reload: vi.fn(),
    });

    const user = userEvent.setup();
    render(<JournalRankingTable />);

    expect(
      screen.getByRole("link", { name: "Matched journal" }),
    ).toHaveAttribute("href", "/student/journals/S1");
    expect(
      screen.queryByRole("link", { name: "Unmatched journal" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("10.5")).toBeInTheDocument();
    expect(screen.getByText("UNMATCHED")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Ranking year"), "2024");
    expect(useJournalRankings).toHaveBeenLastCalledWith(2024, 20);
  });
});

function rankingItem(overrides: Partial<JournalRankingItem>) {
  return { ...rankingItemBase(), ...overrides };
}

function rankingItemBase(): JournalRankingItem {
  return {
    scimagoSourceId: "source",
    journalId: null as string | null,
    issns: ["1234-5678"],
    matchStatus: "PENDING",
    title: "Journal",
    type: "journal",
    sjr: null as number | null,
    hIndex: null as number | null,
    totalDocs: null as number | null,
    totalDocs3Years: null as number | null,
    totalRefs: null as number | null,
    totalCitations3Years: null as number | null,
    citableDocs3Years: null as number | null,
    citationsPerDoc2Years: null as number | null,
    refsPerDoc: null as number | null,
    femalePercentage: null as number | null,
    countryCode: null as string | null,
  };
}
