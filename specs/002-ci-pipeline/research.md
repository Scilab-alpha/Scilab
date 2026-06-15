# Research: CI Pipeline

## Decision: Use GitHub Actions for repository CI

**Rationale**: The repository already contains `.github/` metadata and the
feature requires visible validation status on proposed changes. GitHub Actions
provides native pull request checks, push checks, workflow concurrency, and
service containers without adding an external CI provider.

**Alternatives considered**:

- GitLab CI: capable, but the repository context is GitHub-oriented.
- External CI service: unnecessary for the current scope and would add account
  and secret management before the basic CI gate exists.

## Decision: Use current official pnpm/GitHub Actions setup pattern

**Rationale**: pnpm's CI documentation shows GitHub Actions using checkout,
pnpm setup, setup-node, and pnpm cache. `actions/setup-node` supports dependency
caching for pnpm, and pnpm's official CI examples currently show
`actions/checkout@v6` and `actions/setup-node@v6`.

**Sources**:

- https://pnpm.io/continuous-integration
- https://github.com/actions/setup-node
- https://github.com/actions/checkout

**Alternatives considered**:

- Manual cache keys with actions/cache: more flexible but more moving parts.
- Caching `node_modules`: faster in some cases, but less portable than caching
  the package-manager store.

## Decision: Normalize validation behind workspace scripts

**Rationale**: Several required checks do not yet have CI-safe script names in
all workspaces. For example, root formatting currently writes files, API lint
currently fixes files, mobile lacks a typecheck script, and some workspaces have
no test script. Adding non-mutating scripts such as `format:check`,
`lint:ci`, `check-types`, and `test` where appropriate lets contributors
reproduce CI locally with the same commands.

**Alternatives considered**:

- Put direct commands only in `.github/workflows/ci.yml`: quick to start, but
  hard to reproduce locally and easy for workflow and package scripts to drift.
- Run only root Turborepo commands: useful for shared checks, but current task
  coverage is incomplete for mobile, packages, and API migration validation.

## Decision: Split CI by repository area

**Rationale**: Workspace-oriented jobs make failures easy to diagnose and map
directly to the spec's required validation coverage. Web and API have builds;
mobile and packages do not require build checks in v1. API needs database
migration validation, so it should run separately with a database service.

**Alternatives considered**:

- One monolithic job: simpler YAML, but slower feedback and less useful failure
  grouping.
- Per-package matrix for every workspace: highly scalable, but excessive for
  the current small workspace count and awkward for API-only database setup.

## Decision: Use PostgreSQL service container for API migration deploy

**Rationale**: GitHub documents PostgreSQL service containers for workflows.
Using a disposable PostgreSQL service allows `prisma migrate deploy` to validate
the committed migration set without relying on developer-local databases.

**Sources**:

- https://docs.github.com/actions/guides/creating-postgresql-service-containers
- https://docs.github.com/actions/tutorials/communicating-with-docker-service-containers

**Alternatives considered**:

- Reuse `services/api/docker-compose.yml`: closer to local setup, but slower and
  less direct than a workflow service for one database dependency.
- Skip database validation: violates the feature's required validation coverage
  for `services/api`.

## Decision: Use concurrency cancellation for PR and branch updates

**Rationale**: The spec requires older validation results not to replace newer
ones. GitHub Actions concurrency with `cancel-in-progress` cancels older runs in
the same group, keeping PR feedback focused on the latest commit.

**Source**:

- https://docs.github.com/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency

**Alternatives considered**:

- Allow all runs to finish: wastes runner time and can confuse reviewers with
  stale failures.
- Manual cancellation: unreliable and adds reviewer/contributor overhead.
