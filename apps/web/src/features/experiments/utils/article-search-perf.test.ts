import { describe, expect, it } from "vitest";
import {
  academicArticlePageSize,
  academicJournalPageSize,
  academicListPageSize,
  academicSearchTimeoutMs,
} from "@/core/api/query-config";
import { buildArticleQuery } from "@/features/experiments/api/articles.api";
import { collectArticleTagOptions } from "@/features/experiments/utils/article-tag-options";
import type { ArticleGraph } from "@/features/experiments/types/article.types";

describe("article search performance knobs", () => {
  it("keeps article pages small for faster first paint", () => {
    expect(academicArticlePageSize).toBe(24);
    expect(academicArticlePageSize).toBe(academicListPageSize);
    expect(academicJournalPageSize).toBeLessThanOrEqual(50);
    expect(academicSearchTimeoutMs).toBeGreaterThanOrEqual(45_000);
  });

  it("defaults listArticles query to the fast page size and newest-friendly sort", () => {
    const query = buildArticleQuery({
      q: "Biology",
      publicationYearFrom: 2023,
      publicationYearTo: 2025,
      sort: "newest",
    });
    const params = new URLSearchParams(query);
    expect(params.get("limit")).toBe(String(academicArticlePageSize));
    expect(params.get("q")).toBe("Biology");
    expect(params.get("sort")).toBe("newest");
  });
});

describe("collectArticleTagOptions", () => {
  const sample = [
    {
      article: { id: "W1" },
      keywords: [
        { id: "k2", displayName: "Zeolites" },
        { id: "k1", displayName: "Catalysis" },
      ],
      topics: [{ id: "t1", displayName: "Materials science" }],
    },
    {
      article: { id: "W2" },
      keywords: [{ id: "k1", displayName: "Catalysis" }],
      topics: [{ id: "t2", displayName: "Organic chemistry" }],
    },
  ] as unknown as ArticleGraph[];

  it("builds unique sorted keyword options from result pages", () => {
    expect(collectArticleTagOptions(sample, "keywords")).toEqual([
      { id: "k1", name: "Catalysis" },
      { id: "k2", name: "Zeolites" },
    ]);
  });

  it("builds unique sorted topic options from result pages", () => {
    expect(collectArticleTagOptions(sample, "topics")).toEqual([
      { id: "t1", name: "Materials science" },
      { id: "t2", name: "Organic chemistry" },
    ]);
  });
});
