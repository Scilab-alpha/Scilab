# Feature Specification: Journal-first Academic Sync

**Feature Branch**: `feat/journal-first-academic-sync`  
**Created**: 2026-07-14  
**Status**: Approved  
**Input**: Journal-first academic data pipeline approved by the user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse a ranked journal and its articles (Priority: P1)

A user viewing a SCImago ranking can open the matching journal and browse its
OpenAlex articles, starting from publications in 2020.

**Why this priority**: The ranking-to-journal-to-article journey is the primary
product path and must be reliable before related citation enrichment.

**Independent Test**: Seed a matched journal and article, request rankings,
then use the returned journal ID to fetch journal detail, article list, and
article detail.

**Acceptance Scenarios**:

1. **Given** a latest-catalog SCImago journal matched to one OpenAlex journal,
   **When** rankings are listed, **Then** the item returns its source ID,
   journal ID, ISSNs, and `MATCHED` status.
2. **Given** a selected matched journal, **When** articles are synchronized,
   **Then** its 2020-and-later articles are available through existing journal
   and article APIs without deleting already stored articles.

---

### User Story 2 - See honest matching status (Priority: P2)

An operator can tell whether a SCImago journal has no exact ISSN match or an
ambiguous match, without the system silently choosing a wrong journal.

**Why this priority**: Incorrect journal identity corrupts article discovery
and cannot be corrected safely by title similarity.

**Independent Test**: Resolve fixtures with zero, one, multiple, invalid-type,
and reverse-colliding Source candidates and assert the persisted status.

**Acceptance Scenarios**:

1. **Given** no OpenAlex journal shares any normalized ISSN, **When** sources
   are resolved, **Then** the journal is recorded as `UNMATCHED`.
2. **Given** a candidate set has multiple journal IDs or collides with another
   SCImago source, **When** sources are resolved, **Then** every affected row
   is recorded as `CONFLICT` and has no public journal ID.

---

### User Story 3 - Operate bounded, resumable synchronization (Priority: P3)

An operator can run scheduled synchronization without repeating completed
pages, exceeding the daily page budget, or blocking article ingestion because
citation enrichment fails.

**Why this priority**: The catalog contains tens of thousands of journals;
safe recovery and fair progress are essential to finish the backfill.

**Independent Test**: Simulate a crash after one page, retry, and verify the
cursor, counts, budget, and separate reference-crawl state behave correctly.

**Acceptance Scenarios**:

1. **Given** a backfill with a saved cursor, **When** the job resumes, **Then**
   it starts from that cursor and saves the next cursor only after the page is
   stored successfully.
2. **Given** the daily page limit is spent, **When** another journal is due,
   **Then** it remains pending for a later pass rather than fetching a page.

### Edge Cases

- ISSNs differing only by case, whitespace, punctuation, or an `X` check digit
  normalize to one comparison value.
- A Source with a matching ISSN but a non-journal type is never a match.
- A page failure, 429, or server error does not advance the journal cursor.
- Older graph articles remain available and are enriched when IDs overlap.
- Citation failures do not turn a successful journal/article sync into failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST use only `Type=journal` rows from the newest
  available SCImago catalog for journal discovery.
- **FR-002**: The system MUST match journals only by normalized exact ISSN and
  MUST persist `PENDING`, `MATCHED`, `UNMATCHED`, or `CONFLICT` outcomes.
- **FR-003**: A match MUST identify exactly one OpenAlex Source with
  `type=journal`; a reverse collision MUST become `CONFLICT`.
- **FR-004**: The system MUST retain SCImago rankings for catalog years
  2023–2025 once per journal and store per-journal sync progress.
- **FR-005**: Article discovery MUST use the matched journal ID, include
  articles from 2020 onward, use resumable cursor pages, and preserve existing
  articles.
- **FR-006**: A pass MUST fetch at most 10 pages per journal and 1,000 pages
  globally per day by default, with fair rotation between journals.
- **FR-007**: Article ingestion MUST not create citation edges or reference
  placeholders; outgoing references MUST be crawled by a separate job.
- **FR-008**: The ranking API item MUST expose SCImago source ID, nullable
  journal ID, ISSNs, and matching status in the standard response envelope and
  documented API contract.
- **FR-009**: Scheduled jobs MUST reload SCImago, resolve sources, sync
  journal articles, then run reference jobs in that order.
- **FR-010**: Worker configuration MUST receive OpenAlex credentials and run
  database deployment without installing packages at container startup.

### Test Expectations *(mandatory)*

- **TE-001**: Unit tests cover ISSN matching, collisions, state transitions,
  filter reset, cursor retry, fairness, and daily budget behavior.
- **TE-002**: Client tests cover batches of 100 ISSNs, Works filters/cursors,
  retryable status handling, and unrecoverable responses.
- **TE-003**: Repository tests distinguish inserted from updated article IDs
  and confirm page-level persistence.
- **TE-004**: API contract tests verify ranking status fields and standard
  success/failure envelope behavior.
- **TE-005**: Schema validation covers a fresh database and journal sync state
  and ranking data.

### Data Migration Expectations

- **DM-001**: All schema work MUST be folded into
  `services/api/prisma/migrations/20260715010000_add_academic_pipeline/migration.sql`.
- **DM-002**: Journal synchronization progress is stored only per journal.

### Key Entities

- **AcademicJournalSyncState**: The exact-match outcome and per-journal article
  cursor/state for one SCImago source.
- **Journal**: An OpenAlex Source represented in the academic graph, enriched
  with SCImago catalog metadata.
- **JournalRanking**: Historical SCImago ranking metrics linked to its source.
- **Article**: A work published in a matched journal, enriched separately from
  its outgoing citations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every latest-catalog journal has an explicit matching status
  after source resolution completes.
- **SC-002**: A successful worker pass never fetches more than the configured
  daily number of article pages or ten pages for a single journal.
- **SC-003**: Re-running a completed page produces no duplicate articles and
  reports accurate inserted versus updated counts.
- **SC-004**: Users can complete ranking → journal → article detail using the
  returned journal ID for every matched journal.

## Assumptions

- The newest available SCImago year is selected dynamically; current source
  data is expected to include 2025.
- The archive keeps 2023–2025 rankings where present.
- Source and Works requests follow OpenAlex pagination and rate-limit rules.
- Title matching, book series, and conference proceedings are out of scope.
