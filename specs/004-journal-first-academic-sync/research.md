# Research: Journal-first Academic Sync

## Decisions

- **Exact matching**: Normalize ISSNs by removing punctuation/whitespace and
  uppercasing. Query OpenAlex Sources in groups of 100, then accept only
  `type=journal` candidates. This makes matches explainable and avoids false
  title matches.
- **Cursor durability**: Persist the next cursor only after graph persistence
  succeeds. Start missing cursors at `*`; a retry repeats at most one safe
  upsert page.
- **Fair budget**: Store a date-keyed counter atomically in Redis before a Works
  request. Process each eligible journal for a bounded number of pages before
  moving on.
- **Citation separation**: Works listing omits `referenced_works`; detail
  crawling performs citation edge/placeholder creation after article sync.
- **Migration**: Amend the active academic pipeline migration because this
  feature is unreleased, preserving a fresh-database path.
