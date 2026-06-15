# CI Validation Contract

This feature has no HTTP API contract. The contract is the required behavior of
the CI workflow and local scripts.

## Trigger Contract

- CI MUST run on pull request updates targeting protected integration branches.
- CI MUST run on direct pushes to protected integration branches.
- CI MUST allow manual re-run from the repository workflow UI.
- CI MUST cancel older in-progress runs for the same branch or pull request when
  a newer revision starts.

## Common Setup Contract

- CI MUST check out the repository before validation.
- CI MUST install the repository package manager version declared by the repo.
- CI MUST install dependencies using the lockfile without mutating it.
- CI MUST cache pnpm package data using the checked-in lockfile as the cache
  dependency path.
- CI MUST avoid printing secrets or private configuration.

## Workspace Validation Contract

| Area | Format | Lint | Typecheck | Build | Test | Migration Deploy |
|------|--------|------|-----------|-------|------|------------------|
| `apps/web` | Required | Required | Required | Required | If declared | Not applicable |
| `apps/mobile` | Required | Required | Required | Not applicable | If declared | Not applicable |
| `services/api` | Required | Required | Required | Required | Required | Required |
| `packages/*` | Required | Required | Required | Not applicable | If declared | Not applicable |

## Failure Reporting Contract

- A failed validation group MUST fail the workflow.
- Each job name MUST identify its repository area.
- Each step name MUST identify the validation group being run.
- Logs MUST preserve enough detail to reproduce the failure locally.
- Missing optional test scripts MUST be reported as skipped rather than failed.
- Missing required non-test scripts MUST be handled during implementation by
  adding a script or documenting the check as unavailable with a follow-up owner.

## API Database Contract

- API migration validation MUST use an isolated PostgreSQL database.
- `services/api` CI MUST run Prisma generation before build or migration
  validation when required by the API package.
- `services/api` CI MUST run migration deploy against a fresh database.
- The CI database URL MUST point to the isolated CI database, not any shared
  development or production database.
