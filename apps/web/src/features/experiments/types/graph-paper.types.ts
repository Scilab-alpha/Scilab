export type GraphPaperInfo = {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  /** Inbound citation count from the academic API (`article.citationCount`). */
  citationCount: number;
};

export function shortAuthorLabel(authors: string[], year: number | null) {
  const first = authors[0]?.split(" ").at(-1) ?? authors[0] ?? "Paper";
  if (year == null) {
    return first;
  }
  return `${first}, ${year}`;
}
