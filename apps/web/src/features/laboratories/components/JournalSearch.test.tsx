import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JournalSearch from "./JournalSearch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/laboratories/hooks/use-journals", () => ({
  useJournals: () => ({
    items: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
    reload: vi.fn(),
    loadMore: vi.fn(),
  }),
}));

vi.mock("@/shared/components/layout/StudentTopHeader", () => ({
  default: () => <header />,
}));

describe("JournalSearch", () => {
  it("does not expose filters or search unsupported by the journal API", () => {
    render(<JournalSearch />);

    expect(
      screen.queryByLabelText("Search journal catalog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ranking Metric")).not.toBeInTheDocument();
    expect(screen.queryByText("Subject Area")).not.toBeInTheDocument();
    expect(screen.queryByText("Sort by:")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
