# Implementation Plan: CI Pipeline

**Branch**: `ci/ci-pipeline` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ci-pipeline/spec.md`

## Summary

Add repository CI so pull requests and protected branch updates automatically
validate formatting, linting, type correctness, builds, tests, and API database
migrations across `apps/web`, `apps/mobile`, `services/api`, and `packages/*`.
The plan uses GitHub Actions, pnpm workspace commands, Turborepo where existing
workspace tasks fit, CI-safe package scripts that do not rewrite files, and a
PostgreSQL service container for API migration validation.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22.x for CI; repo package
manager is pnpm 11.7.0

**Primary Dependencies**: GitHub Actions, pnpm, Turborepo, Prettier, ESLint,
TypeScript, Next.js, Expo, NestJS, Prisma, Jest, Supertest, PostgreSQL 16

**Storage**: No new application storage. CI uses an isolated PostgreSQL service
container only for `services/api` migration and database-aware validation.

**Testing**: API Jest unit tests and Supertest e2e tests; package/app tests when
a workspace declares a test command; workflow validation by an intentional
failing-change check and CI dry-run review before merge

**Target Platform**: GitHub-hosted Linux CI runners for a pnpm monorepo

**Project Type**: Monorepo with web app, mobile app, API service, and shared
packages

**Performance Goals**: Validation status appears within 2 minutes; 95% of
typical application changes finish required CI checks within 15 minutes

**Constraints**: CI commands must be non-mutating; deployment is out of scope;
secrets must not be printed; outdated runs must be canceled; API migration
validation must run against an isolated database; checks with no matching
workspace script must either receive a script or be documented as unavailable

**Scale/Scope**: One CI workflow for the current repository areas:
`apps/web`, `apps/mobile`, `services/api`, and `packages/*`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Branch name follows Angular Conventional Commits branch format:
  `ci/ci-pipeline` uses an allowed type and kebab-case description. PASS.
- Backend Clean Architecture boundaries are not changed by this feature; CI
  only validates backend code. PASS.
- Backend API response envelope implementation is not changed; API tests remain
  part of CI validation. PASS.
- No persisted schema change is introduced. CI validates Prisma migrations via
  `prisma migrate deploy` against an isolated database. PASS.
- Implementation plan follows TDD for CI configuration: add failing workflow or
  script validation checks before finalizing green CI configuration. PASS.
- No justified constitution violations are present. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-ci-pipeline/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- ci-validation-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md             # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
.github/
`-- workflows/
    `-- ci.yml

package.json
turbo.json
pnpm-lock.yaml

apps/
|-- web/
|   |-- package.json
|   |-- eslint.config.js
|   `-- tsconfig.json
`-- mobile/
    |-- package.json
    |-- eslint.config.js
    `-- tsconfig.json

services/
`-- api/
    |-- package.json
    |-- prisma/
    |   |-- schema.prisma
    |   `-- migrations/
    |-- jest.config.js
    |-- test/
    `-- tsconfig.json

packages/
|-- eslint-config/
|   `-- package.json
`-- typescript-config/
    `-- package.json
```

**Structure Decision**: Keep CI configuration at repository root in
`.github/workflows/ci.yml` and normalize reusable validation commands through
workspace `package.json` scripts. Avoid embedding long one-off shell commands in
the workflow so local reproduction stays straightforward.

## Phase 0: Research

Research completed in [research.md](./research.md). Key decisions:

- Use GitHub Actions as the CI runner because the repository already stores
  GitHub metadata and the feature requires PR/status-check integration.
- Use pnpm workspace installation with setup-node pnpm cache and lockfile-frozen
  install so CI matches the checked-in dependency graph.
- Split CI into workspace-oriented jobs: setup/common dependency install,
  web validation, mobile validation, API validation, and package validation.
- Add CI-safe scripts for formatting/linting/type checks where current scripts
  are missing or mutating.
- Use a PostgreSQL service container for API `prisma migrate deploy`.
- Use workflow concurrency with cancel-in-progress so older runs cannot replace
  newer PR feedback.

## Phase 1: Design & Contracts

Design artifacts generated:

- [data-model.md](./data-model.md)
- [contracts/ci-validation-contract.md](./contracts/ci-validation-contract.md)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- Branch naming remains compliant. PASS.
- CI does not alter backend Clean Architecture boundaries and will validate API
  code through existing package scripts. PASS.
- API response envelope remains governed by API tests included in CI. PASS.
- No schema change is introduced; migration deploy validation proves the current
  migration set can create a fresh database. PASS.
- Tasks must place workflow/script validation checks before final CI completion
  and include an intentional failing-change scenario. PASS.
- No justified constitution violations are present. PASS.

## Complexity Tracking

No constitution violations.
