/** Shared React Query defaults for list/detail screens. */
export const listQueryStaleTimeMs = 90_000;
export const listQueryGcTimeMs = 10 * 60_000;
export const academicListPageSize = 24;
/** Articles list page size — keep modest for faster search responses. */
export const academicArticlePageSize = 24;
/** Journals list page size (client filters may load more pages). */
export const academicJournalPageSize = 50;
/** Academic search can exceed the default 15s API timeout (esp. `relevant`). */
export const academicSearchTimeoutMs = 45_000;
