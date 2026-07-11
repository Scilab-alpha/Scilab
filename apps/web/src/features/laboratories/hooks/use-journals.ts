"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listJournals } from "@/features/experiments/api/journals.api";
import type { JournalListItem } from "@/features/experiments/types/journal.types";

export function useJournals() {
  const [items, setItems] = useState<JournalListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const collected: JournalListItem[] = [];
      let cursor: string | null = null;

      do {
        const page = await listJournals({ limit: 50, cursor });
        collected.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      setItems(collected);
    } catch (fetchError) {
      setItems([]);
      setError(getUserFriendlyApiErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    isLoading,
    error,
    reload,
  };
}
