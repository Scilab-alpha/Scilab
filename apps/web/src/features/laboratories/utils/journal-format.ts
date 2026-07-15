import type { JournalListItem } from "@/features/experiments/types/journal.types";

export function getJournalName(journal: JournalListItem) {
  return journal.displayName?.trim() || "Untitled journal";
}

export function getJournalIssn(journal: JournalListItem) {
  return journal.issnList?.[0]?.trim() || "—";
}

export function getJournalPublisher(journal: JournalListItem) {
  return journal.publisherName?.trim() || "—";
}

export function getJournalCountry(journal: JournalListItem) {
  return journal.country?.trim() || "—";
}

export function getJournalSubjects(journal: JournalListItem) {
  return (journal.subjectCategories ?? []).filter(Boolean);
}
