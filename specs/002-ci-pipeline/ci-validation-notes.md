# CI Validation Notes

## Setup And Script Decisions

- Root install command validated: `pnpm install --frozen-lockfile` completed
  with the checked-in lockfile.
- Root `format:check` uses Prettier in check mode and does not rewrite files.
- `apps/web` declares format, lint, typecheck, and build scripts. It does not
  declare a test script yet; CI reports web tests as skipped.
- `apps/mobile` declares format, lint, and typecheck scripts. It does not
  declare a test script yet; CI reports mobile tests as skipped.
- `services/api` declares format, non-mutating `lint:ci`, typecheck, build,
  unit test, e2e test, Prisma generate, and Prisma migrate deploy scripts.
- `packages/eslint-config` declares format, lint, and JS typecheck scripts.
- `packages/typescript-config` contains JSON config only; CI validates JSON
  parseability and required `compilerOptions` instead of looking for TS source.
  It does not declare a test script yet; CI reports package tests as skipped.

## User Story 1 Evidence

Baseline before implementation:

- Missing `.github/workflows/ci.yml` meant proposed changes had no automated
  repository CI gate.
- Required workspace scripts were missing or mutating: root/mobile/web lacked
  `format:check`, API lint used `--fix`, mobile lacked `check-types`, and
  packages lacked validation scripts.

Workflow contract checklist:

- [x] Pull request trigger targets protected integration branches.
- [x] Push trigger targets protected integration branches.
- [x] Manual `workflow_dispatch` trigger is available.
- [x] Checkout runs before validation in each job.
- [x] pnpm 9.0.0 and Node.js 22 are installed in each validation job.
- [x] Dependencies install with `pnpm install --frozen-lockfile`.
- [x] pnpm cache uses `pnpm-lock.yaml`.
- [x] `apps/web` runs format, lint, typecheck, build, and test-if-declared.
- [x] `apps/mobile` runs format, lint, typecheck, and test-if-declared.
- [x] `services/api` runs format, lint, typecheck, build, unit tests, e2e
  tests, Prisma generate, and Prisma migrate deploy.
- [x] `packages/*` runs format, lint, typecheck, and test-if-declared.

Local validation results:

- `pnpm install --frozen-lockfile`: pass.
- `pnpm format:check`: pass.
- `pnpm lint`: pass.
- `pnpm check-types`: pass.
- `pnpm build`: pass.
- `pnpm --filter web format:check`: pass.
- `pnpm --filter web lint`: pass.
- `pnpm --filter web check-types`: pass.
- `pnpm --filter web build`: pass.
- `pnpm --filter mobile format:check`: pass after formatting the existing
  mobile workspace.
- `pnpm --filter mobile lint`: pass.
- `pnpm --filter mobile check-types`: pass.
- `pnpm --filter api format:check`: pass.
- `pnpm --filter api lint:ci`: pass.
- `pnpm --filter api check-types`: pass after removing over-specific Jest
  matcher generics from two auth specs.
- `pnpm --filter api build`: pass.
- `pnpm --filter api test`: pass, 7 suites and 15 tests.
- `pnpm --filter api test:e2e`: pass, 2 suites and 9 tests.
- `pnpm --filter api prisma:deploy`: pass against a disposable PostgreSQL 16
  container on port 55432.
- `pnpm --filter @repo/eslint-config --filter @repo/typescript-config
  format:check`: pass.
- `pnpm --filter @repo/eslint-config --filter @repo/typescript-config lint`:
  pass.
- `pnpm --filter @repo/eslint-config --filter @repo/typescript-config
  check-types`: pass.
- `pnpm exec prettier --check .github/workflows/ci.yml`: pass.

## User Story 2 Evidence

Failure-diagnosis scenarios:

- Formatting failures appear under `apps/<area> format check`,
  `services/api format check`, or `packages format check`.
- Lint failures appear under `<area> lint check`.
- Type errors appear under `<area> typecheck`.
- Build failures appear under `apps/web build` or `services/api build`.
- Unit and e2e test failures appear under `services/api unit tests`,
  `services/api e2e tests`, or the relevant `test if declared` step.
- Migration failures appear under `services/api Prisma migrate deploy`.

The workflow names each job by repository area and each step by validation
group, so contributors can reproduce failures with the matching quickstart
command.

## User Story 3 Evidence

Practical daily-work scenarios:

- Documentation-only and metadata-only changes still run the workflow and pass
  through `Docs and metadata status` plus `CI summary`; code validation jobs are
  skipped when no code-sensitive paths changed.
- Code changes under `apps/*`, `services/*`, `packages/*`, root package
  metadata, Turbo config, pnpm workspace/lockfile, or CI workflow files run all
  required validation jobs.
- Repeated pushes use workflow concurrency with `cancel-in-progress: true`, so
  older runs for the same PR or branch are canceled.

Timing target measurement:

- For each representative PR, record the elapsed time of `CI summary`.
- A typical application change passes the target when required validation
  completes within 15 minutes.
- If GitHub-hosted runner startup or PostgreSQL service startup causes a
  transient outage, rerun the failed workflow from the Actions UI.

## Final Acceptance Notes

- CI commands avoid printing repository secrets. The workflow uses an isolated
  non-secret PostgreSQL URL only for CI.
- `git diff --check` completed successfully.
- `git status --short` after validation showed the intended implementation and
  documentation edits, plus ignored build artifacts generated by local checks.
  No unexpected tracked file was mutated by validation commands.
