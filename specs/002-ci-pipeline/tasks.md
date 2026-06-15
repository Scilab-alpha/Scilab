# Tasks: CI Pipeline

**Input**: Design documents from `/specs/002-ci-pipeline/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ci-validation-contract.md](./contracts/ci-validation-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Tests are REQUIRED by the constitution. For this CI feature, tests include CI-safe validation scripts, intentional failing-change checks, workflow contract review, and local command validation before implementation is considered complete.

**Organization**: Tasks are grouped by user story so each story can be implemented, validated, and reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it edits a different file or has no dependency on another incomplete task.
- **[Story]**: Maps to a user story in [spec.md](./spec.md).
- All task descriptions include exact file paths.
- Test and validation tasks appear before the production workflow tasks they validate.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare CI directories, reusable conventions, and baseline non-mutating commands.

- [X] T001 Create GitHub workflow directory structure in `.github/workflows/`
- [X] T002 [P] Add repository-level `format:check` script alongside existing scripts in `package.json`
- [X] T003 [P] Add Turborepo task entries for `format:check` and `test` in `turbo.json`
- [X] T004 [P] Create CI validation notes file in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T005 Create initial CI workflow skeleton with name, triggers, permissions, and empty jobs in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Normalize workspace commands so workflow jobs can call reproducible local scripts.

**CRITICAL**: No user story work can begin until these scripts exist or are explicitly documented as unavailable.

- [X] T006 [P] Add non-mutating `format:check` and optional `test` script decisions for web validation in `apps/web/package.json`
- [X] T007 [P] Add non-mutating `format:check`, `check-types`, and optional `test` script decisions for mobile validation in `apps/mobile/package.json`
- [X] T008 [P] Add non-mutating `format:check`, `lint:ci`, `check-types`, and `test:e2e` CI script alignment for API validation in `services/api/package.json`
- [X] T009 [P] Add script availability decisions for shared packages in `packages/eslint-config/package.json`
- [X] T010 [P] Add script availability decisions for shared packages in `packages/typescript-config/package.json`
- [X] T011 Update package validation strategy and any new task names in `turbo.json`
- [X] T012 Document any intentionally unavailable required checks and follow-up owners in `specs/002-ci-pipeline/ci-validation-notes.md`

**Checkpoint**: Foundation ready; all workspace validation groups have a local command or documented unavailability.

---

## Phase 3: User Story 1 - Validate Changes Before Merge (Priority: P1) MVP

**Goal**: Every proposed change receives required CI checks and failed required checks prevent merge-ready status.

**Independent Test**: Create or simulate one intentional required-check failure and verify `.github/workflows/ci.yml` reports the failed validation group instead of passing.

### Tests for User Story 1

> Write or run these validation checks FIRST and verify they fail before completing the workflow implementation.

- [X] T013 [P] [US1] Record baseline failure for missing CI workflow behavior in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T014 [P] [US1] Add workflow contract checklist for triggers, setup, required jobs, and required steps in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T015 [P] [US1] Validate root install and lockfile command from quickstart in `specs/002-ci-pipeline/quickstart.md`

### Implementation for User Story 1

- [X] T016 [US1] Implement CI triggers for pull requests, protected branch pushes, and manual runs in `.github/workflows/ci.yml`
- [X] T017 [US1] Implement shared setup steps with checkout, pnpm setup, Node.js 22, pnpm cache, and frozen lockfile install in `.github/workflows/ci.yml`
- [X] T018 [US1] Implement `web` job with format, lint, typecheck, build, and test-if-available steps in `.github/workflows/ci.yml`
- [X] T019 [US1] Implement `mobile` job with format, lint, typecheck, and test-if-available steps in `.github/workflows/ci.yml`
- [X] T020 [US1] Implement `api` job with format, lint, typecheck, build, unit tests, e2e tests, PostgreSQL service, and Prisma migrate deploy in `.github/workflows/ci.yml`
- [X] T021 [US1] Implement `packages` job with format, lint, typecheck, and test-if-available steps for `packages/*` in `.github/workflows/ci.yml`
- [X] T022 [US1] Update CI completion evidence for all required validation groups in `specs/002-ci-pipeline/ci-validation-notes.md`

**Checkpoint**: User Story 1 is independently testable as the MVP CI gate.

---

## Phase 4: User Story 2 - Diagnose Failures Quickly (Priority: P2)

**Goal**: Contributors can identify the failed validation group within one minute and reproduce it locally.

**Independent Test**: Submit or simulate separate failures for format, lint, typecheck, build, test, and migration validation, then confirm each failed step name points to the failing group.

### Tests for User Story 2

- [X] T023 [P] [US2] Add failure-diagnosis scenarios for format, lint, typecheck, build, test, and migration deploy in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T024 [P] [US2] Verify quickstart local reproduction commands cover every CI step in `specs/002-ci-pipeline/quickstart.md`

### Implementation for User Story 2

- [X] T025 [US2] Rename workflow jobs and steps to identify repository area and validation group in `.github/workflows/ci.yml`
- [X] T026 [US2] Add explicit skipped-test messages for workspaces without test scripts in `.github/workflows/ci.yml`
- [X] T027 [US2] Add API database environment naming that distinguishes CI PostgreSQL from local or production databases in `.github/workflows/ci.yml`
- [X] T028 [US2] Update local failure reproduction guidance for each validation group in `specs/002-ci-pipeline/quickstart.md`
- [X] T029 [US2] Record failure-diagnosis evidence and any remaining gaps in `specs/002-ci-pipeline/ci-validation-notes.md`

**Checkpoint**: CI failures are diagnosable by job and step name without rerunning the whole pipeline blindly.

---

## Phase 5: User Story 3 - Keep The Pipeline Practical For Daily Work (Priority: P3)

**Goal**: CI avoids stale runs, stays scoped to meaningful changes, and completes in the target time for normal application changes.

**Independent Test**: Run representative documentation-only, code-only, and repeated-push scenarios and verify path behavior, cancellation behavior, and timing targets.

### Tests for User Story 3

- [X] T030 [P] [US3] Add documentation-only, code-only, and repeated-push validation scenarios in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T031 [P] [US3] Add timing target measurement procedure for the 15-minute CI goal in `specs/002-ci-pipeline/ci-validation-notes.md`

### Implementation for User Story 3

- [X] T032 [US3] Add workflow concurrency group with cancel-in-progress behavior in `.github/workflows/ci.yml`
- [X] T033 [US3] Add path filters or job conditions for documentation-only and metadata-only changes in `.github/workflows/ci.yml`
- [X] T034 [US3] Add dependency caching and job ordering refinements to keep normal runs under the target time in `.github/workflows/ci.yml`
- [X] T035 [US3] Update practical daily-work validation results in `specs/002-ci-pipeline/ci-validation-notes.md`

**Checkpoint**: CI is practical for daily review flow and stale feedback is minimized.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and full acceptance validation.

- [X] T036 [P] Update CI workflow documentation in `README.md`
- [X] T037 [P] Update CI command reference in `specs/002-ci-pipeline/quickstart.md`
- [X] T038 Verify no CI command mutates tracked files by checking `git status --short` after local validation and record result in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T039 Verify secrets and private configuration are not printed by workflow steps and record result in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T040 Run the full quickstart validation flow and record results in `specs/002-ci-pipeline/ci-validation-notes.md`
- [X] T041 Update task completion evidence and final acceptance notes in `specs/002-ci-pipeline/ci-validation-notes.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers MVP CI gate.
- **User Story 2 (Phase 4)**: Depends on User Story 1 workflow jobs existing.
- **User Story 3 (Phase 5)**: Depends on User Story 1 workflow jobs existing; can run partly in parallel with User Story 2 after MVP.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP; must complete first.
- **User Story 2 (P2)**: Builds on User Story 1 job and step structure.
- **User Story 3 (P3)**: Builds on User Story 1 workflow structure; independent from User Story 2 except for final documentation.

### Within Each User Story

- Validation/test evidence tasks must be done before implementation tasks.
- Package scripts must exist before workflow steps call them.
- API PostgreSQL service must exist before `prisma migrate deploy` is wired into CI.
- Workflow implementation must be complete before quickstart and acceptance evidence are finalized.

---

## Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001.
- T006 through T010 can run in parallel because they edit separate workspace package files.
- T013 through T015 can run in parallel because they update validation evidence and quickstart checks before workflow implementation.
- T023 and T024 can run in parallel for User Story 2.
- T030 and T031 can run in parallel for User Story 3.
- T036 and T037 can run in parallel during polish.

---

## Parallel Example: User Story 1

```text
Task: "T013 [P] [US1] Record baseline failure for missing CI workflow behavior in specs/002-ci-pipeline/ci-validation-notes.md"
Task: "T014 [P] [US1] Add workflow contract checklist for triggers, setup, required jobs, and required steps in specs/002-ci-pipeline/ci-validation-notes.md"
Task: "T015 [P] [US1] Validate root install and lockfile command from quickstart in specs/002-ci-pipeline/quickstart.md"
```

---

## Parallel Example: User Story 2

```text
Task: "T023 [P] [US2] Add failure-diagnosis scenarios for format, lint, typecheck, build, test, and migration deploy in specs/002-ci-pipeline/ci-validation-notes.md"
Task: "T024 [P] [US2] Verify quickstart local reproduction commands cover every CI step in specs/002-ci-pipeline/quickstart.md"
```

---

## Parallel Example: User Story 3

```text
Task: "T030 [P] [US3] Add documentation-only, code-only, and repeated-push validation scenarios in specs/002-ci-pipeline/ci-validation-notes.md"
Task: "T031 [P] [US3] Add timing target measurement procedure for the 15-minute CI goal in specs/002-ci-pipeline/ci-validation-notes.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 script normalization.
3. Add failing CI validation evidence for User Story 1.
4. Implement the workflow jobs required to block broken changes.
5. Validate User Story 1 independently before improving diagnostics or speed.

### Incremental Delivery

1. Deliver User Story 1 to establish the required CI gate.
2. Add User Story 2 so failures are easier to diagnose.
3. Add User Story 3 so daily review flow stays fast and avoids stale runs.
4. Finish polish by updating docs and recording acceptance evidence.

### Parallel Team Strategy

1. One developer normalizes workspace package scripts while another drafts the workflow skeleton.
2. After foundational tasks complete, one developer can implement web/mobile/package jobs while another implements API database validation.
3. Diagnostics and practical-flow improvements can proceed in parallel after the MVP workflow is green.

---

## Notes

- `[P]` tasks touch different files or evidence sections and can be parallelized safely.
- `[US1]`, `[US2]`, and `[US3]` labels map directly to the prioritized user stories in [spec.md](./spec.md).
- `scripts` that run in CI must check instead of rewrite whenever possible.
- Missing optional test scripts should be skipped with a clear message; missing required non-test scripts must be added or documented with an owner.
- The Spec Kit prerequisite script rejects `ci/ci-pipeline` because it expects numbered branches, but the project constitution accepts `ci/ci-pipeline`; `.specify/feature.json` points to `specs/002-ci-pipeline`.
