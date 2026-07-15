# Tasks: Journal-first Academic Sync

**Input**: Design documents from `/specs/004-journal-first-academic-sync/`

## Phase 1: Setup

- [x] T001 Update managed Spec Kit reference in `AGENTS.md`
- [x] T002 Document the journal-first feature in `specs/004-journal-first-academic-sync/`

## Phase 2: Foundational

- [x] T003 Add sync state schema, enums, indexes, and consolidated SQL in `services/api/prisma/schema.prisma` and `services/api/prisma/migrations/20260715010000_add_academic_pipeline/migration.sql`
- [x] T004 Add source, journal-state, and page-budget ports in `services/api/src/academic/application/ports/`
- [x] T005 Add failing ISSN/source-matching tests in `services/api/src/academic/application/services/`
- [x] T006 Implement normalized exact ISSN matching in `services/api/src/academic/application/services/`

## Phase 3: User Story 1 - Ranked journal article journey (P1)

**Goal**: Resolve journals and sync their articles for the existing browsing API.

- [x] T007 [P] [US1] Add source-client and journal-state repository tests in `services/api/src/academic/infrastructure/`
- [x] T008 [US1] Implement OpenAlex Sources client and Prisma state repository in `services/api/src/academic/infrastructure/`
- [x] T009 [P] [US1] Add resolver/coordinator use-case tests in `services/api/src/academic/application/use-cases/`
- [x] T010 [US1] Implement SCImago source resolution and Journal graph/ranking persistence in `services/api/src/academic/application/use-cases/resolve-scimago-journals/`
- [x] T011 [US1] Implement per-journal Works cursor sync and graph batch upsert in `services/api/src/academic/application/use-cases/run-journal-article-sync-pipeline/`

## Phase 4: User Story 2 - Honest source status (P2)

- [x] T012 [P] [US2] Add ranking response contract tests in `services/api/src/academic/interfaces/http/`
- [x] T013 [US2] Return journal identity, ISSNs, and matching status from `services/api/src/academic/application/use-cases/list-journal-rankings/`
- [x] T014 [US2] Update Swagger schemas and decorators in `services/api/src/academic/interfaces/http/`

## Phase 5: User Story 3 - Bounded, independent jobs (P3)

- [x] T015 [P] [US3] Add daily-budget and outgoing-reference use-case tests in `services/api/src/academic/application/use-cases/`
- [x] T016 [US3] Implement atomic Redis page budget and separate outgoing-reference crawl in `services/api/src/academic/infrastructure/` and `services/api/src/academic/application/use-cases/`
- [x] T017 [US3] Replace article-sync queue scheduling/processing with journal-first jobs in `services/api/src/academic/interfaces/{queues,schedulers}/`
- [x] T018 [US3] Wire ports/adapters/use cases in `services/api/src/academic/academic.module.ts`

## Phase 6: Polish & Validation

- [x] T019 Update `services/api/.env.example`, `services/api/Dockerfile`, and `docker-compose.yml` worker runtime configuration
- [x] T020 Run Prisma generation, targeted/unit tests, type checking, build, and migration validation; mark completed tasks
