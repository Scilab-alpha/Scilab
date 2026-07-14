# Implementation Plan: Journal-first Academic Sync

**Branch**: `feat/journal-first-academic-sync` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

## Summary

Replace topic/article-first ingestion with `SCImago latest catalog → exact ISSN
match → OpenAlex journal → journal articles → graph`. The source resolver stores
explicit outcomes and the article coordinator advances independently per journal
under a shared daily page limit. Citations are deliberately a later job.

## Technical Context

**Language/Version**: TypeScript / Node.js with NestJS.  
**Primary Dependencies**: Prisma/PostgreSQL, Neo4j, BullMQ/Redis, Axios,
Swagger decorators.  
**Storage**: PostgreSQL ranking/state records and Neo4j academic graph.  
**Testing**: Jest unit, repository, API contract, and migration validation.  
**Target Platform**: API and background worker containers.  
**Project Type**: Monorepo backend service.  
**Performance Goals**: 100 Works/page, max 10 pages/journal/pass, 1,000 pages/day.  
**Constraints**: Exact ISSN only; no automatic title fallback; retain graph data;
respect Retry-After for 429/5xx; 400/401/403 are terminal.  
**Scale/Scope**: Latest catalog is approximately 30,412 journal rows; 2020+
article backfill with 2023–2025 ranking history.

## Constitution Check

- Branch uses an allowed conventional `feat/` prefix: PASS.
- Ports/use-cases/adapters retain Clean Architecture direction: PASS.
- Ranking output keeps the shared response envelope: PASS.
- Existing ranking endpoint Swagger is updated in the same change: PASS.
- Schema work is consolidated in `20260715010000_add_academic_pipeline`: PASS.
- Tests are listed before production implementation in tasks: PASS.

## Design Decisions

1. Source resolution batches a maximum of 100 normalized ISSNs. One and only
   one `type=journal` Source is required; shared Source IDs cause conflict.
2. `AcademicJournalSyncState` is keyed by `scimagoSourceId`; non-null OpenAlex
   IDs are unique. It owns cursor, filter signature, incremental window, and
   success timestamps.
3. Backfills use `primary_location.source.id:<id>,type:article,from_publication_date:2020-01-01`
   and cursor `*`. Incremental windows start one day before the prior success.
4. Redis consumes a date-keyed atomic page counter before each fetch, preventing
   concurrent workers/retries from resetting the budget.
5. New article pages omit references. The outgoing-reference job later fetches
   article details in groups of up to 100 and marks success separately.

## Project Structure

```text
services/api/
|-- prisma/schema.prisma
|-- prisma/migrations/20260715010000_add_academic_pipeline/migration.sql
`-- src/academic/
    |-- application/ports/
    |-- application/services/
    |-- application/use-cases/
    |-- infrastructure/openalex/
    |-- infrastructure/persistence/
    `-- interfaces/{queues,schedulers,http}/
```

**Structure Decision**: Add application ports/use cases first, then wire Axios,
Prisma, Neo4j, Redis/BullMQ, queues, scheduler, and existing ranking HTTP
interface. No new public route is required.

## Complexity Tracking

No constitution violations.
