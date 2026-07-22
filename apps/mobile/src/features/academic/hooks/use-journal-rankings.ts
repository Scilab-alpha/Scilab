import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import { listJournalRankings } from "@/features/academic/api/journal-ranking.service";
import type { CursorPage } from "@/features/academic/types/article.type";
import type { JournalRankingListItem } from "@/features/academic/types/journal-ranking.type";

const pageSize = 10;

export function useJournalRankings(year: number) {
  return useInfiniteQuery<
    CursorPage<JournalRankingListItem>,
    Error,
    InfiniteData<CursorPage<JournalRankingListItem>>,
    readonly ["academic", "journal-rankings", number],
    string | null
  >({
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listJournalRankings({
        cursor: pageParam,
        limit: pageSize,
        year,
      }),
    queryKey: ["academic", "journal-rankings", year],
  });
}
