"use client";

import { useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { getJournalById } from "@/features/experiments/api/journals.api";
import type { JournalListItem } from "@/features/experiments/types/journal.types";

export function useJournalDetail(journalId: string) {
  const [journal, setJournal] = useState<JournalListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getJournalById(journalId);

        if (!cancelled) {
          setJournal(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setJournal(null);
          setError(getUserFriendlyApiErrorMessage(fetchError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [journalId]);

  return { journal, isLoading, error };
}
