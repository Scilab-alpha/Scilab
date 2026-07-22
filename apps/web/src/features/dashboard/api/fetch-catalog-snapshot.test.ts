import { beforeEach, describe, expect, it, vi } from "vitest";
import { listArticles } from "@/features/experiments/api/articles.api";
import { listJournals } from "@/features/experiments/api/journals.api";
import { fetchCatalogSnapshot } from "./fetch-catalog-snapshot";

vi.mock("@/features/experiments/api/articles.api", () => ({
  listArticles: vi.fn(),
}));
vi.mock("@/features/experiments/api/journals.api", () => ({
  listJournals: vi.fn(),
}));

describe("fetchCatalogSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only records retrieved from backend APIs", async () => {
    vi.mocked(listArticles).mockResolvedValueOnce({
      items: [article] as never[],
      nextCursor: null,
    });
    vi.mocked(listJournals).mockResolvedValueOnce({
      items: [journal] as never[],
      nextCursor: null,
    });

    await expect(fetchCatalogSnapshot()).resolves.toEqual({
      articles: [article],
      journals: [journal],
      articlesHasMore: false,
      journalsHasMore: false,
    });
  });

  it("propagates backend errors without a static fallback", async () => {
    vi.mocked(listArticles).mockRejectedValueOnce(new Error("offline"));
    vi.mocked(listJournals).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });
    await expect(fetchCatalogSnapshot()).rejects.toThrow("offline");
  });
});

const article = { article: { id: "article-1" } };
const journal = { id: "journal-1" };
