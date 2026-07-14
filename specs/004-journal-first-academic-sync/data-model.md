# Data Model: Journal-first Academic Sync

## AcademicJournalSyncState

| Field | Meaning |
|---|---|
| scimagoSourceId | Primary SCImago identity |
| catalogYear | Latest catalog year evaluated |
| openAlexJournalId | Unique resolved `S...` identity, nullable |
| matchStatus | PENDING, MATCHED, UNMATCHED, or CONFLICT |
| matchedIssn/candidateJournalIds | Explainable resolution evidence |
| syncMode/cursor/filterSignature | Resumable pagination state |
| incrementalWindowFrom | Fixed overlap window for incremental run |
| initialBackfillComplete/lastSuccessfulAt | Completion and freshness state |
| errorDetail | Safe operator-visible failure context |

`JournalRanking` remains historical PostgreSQL data. A Neo4j `Journal` carries
OpenAlex metadata plus the matching SCImago source ID/catalog year. `Article`
has a nullable outgoing-reference crawl timestamp.

## State transitions

`PENDING → MATCHED | UNMATCHED | CONFLICT`; a later catalog reload may re-evaluate
any status. A matched journal begins `BACKFILL`; after its terminal cursor it
becomes `INCREMENTAL`. Any failed page preserves its preceding cursor.
