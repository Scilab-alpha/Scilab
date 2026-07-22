import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const forbiddenProductionTokens = [
  "scilab_local_bookmarks",
  "scilab_local_notifications",
  "scilab_admin_api_source_state",
  "features/submissions/api/local-bookmarks",
  "features/notifications/api/local-notifications",
  "fetch-catalog-sample",
  "50M+ research papers",
  "setTimeout(resolve, 800)",
  "Journal Ranking Progress",
  "rankingProgress",
  "previousRank",
  "Approximate previous rank",
  "bookmarkedAt: result.bookmarkedAt ??",
  "const readAt = new Date().toISOString()",
  "createdAt: item.createdAt ??",
  "citedArticleIds.length} citations",
  "Recently indexed",
  "region: string | null;",
];

describe("backend data-source policy", () => {
  it("does not retain known local or synthetic production data paths", () => {
    const sourceRoot = join(process.cwd(), "src");
    const productionFiles = collectSourceFiles(sourceRoot).filter(
      (file) => !file.includes(".test.") && !file.includes("\\test\\"),
    );
    const source = productionFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    for (const token of forbiddenProductionTokens) {
      expect(source, `production source contains ${token}`).not.toContain(
        token,
      );
    }
  });
});

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}
