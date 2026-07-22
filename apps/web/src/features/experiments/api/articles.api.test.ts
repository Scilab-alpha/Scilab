import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import { buildArticleQuery, listArticles } from "./articles.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("articles.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports relationship and year-range filters without invalid values", () => {
    expect(
      buildArticleQuery({
        keywordId: " keyword-1 ",
        topicId: "topic-1",
        authorId: "author-1",
        journalId: "journal-1",
        publicationYearFrom: 2023,
        publicationYearTo: 2025,
        country: "v",
        sort: "relevant",
      }),
    ).toBe(
      "limit=20&keywordId=keyword-1&topicId=topic-1&authorId=author-1&journalId=journal-1&publicationYearFrom=2023&publicationYearTo=2025&sort=relevant",
    );

    expect(buildArticleQuery({ country: "v", sort: "relevant" })).toBe(
      "limit=20",
    );
  });

  it("sends only Swagger-backed filters to the backend", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });
    const params = {
      q: " climate ",
      limit: 20,
      publicationYear: 2026,
      publisher: " Elsevier ",
      country: "vn",
      sort: "most_cited" as const,
    };

    expect(buildArticleQuery(params)).toBe(
      "limit=20&q=climate&publicationYear=2026&publisher=Elsevier&country=VN&sort=most_cited",
    );
    await listArticles(params);

    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/academic/articles?limit=20&q=climate&publicationYear=2026&publisher=Elsevier&country=VN&sort=most_cited",
    });
  });
});
