# Quickstart: CI Pipeline

## Prerequisites

- Node.js 22.x available locally.
- pnpm 9.0.0 available through Corepack or a local pnpm install.
- Docker available when validating API database migration locally.

## Local Validation Flow

1. Install dependencies from the lockfile:

```powershell
pnpm install --frozen-lockfile
```

2. Run repository-level formatting check after implementation adds a
   non-mutating format script:

```powershell
pnpm format:check
```

3. Run lint and type checks:

```powershell
pnpm lint
pnpm check-types
```

4. Run builds:

```powershell
pnpm build
```

5. Run API tests:

```powershell
pnpm --filter api test
pnpm --filter api test:e2e
```

6. Validate API migration deploy locally against a disposable database:

```powershell
pnpm --filter api db:up
$env:DATABASE_URL = 'postgresql://postgres:123@localhost:5433/scilab?schema=public'
pnpm --filter api prisma:deploy
pnpm --filter api db:down
```

## CI Reproduction Commands By Area

### apps/web

```powershell
pnpm --filter web format:check
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

`apps/web` currently has no test script, so CI prints a skipped-test message.

### apps/mobile

```powershell
pnpm --filter mobile format:check
pnpm --filter mobile lint
pnpm --filter mobile check-types
```

`apps/mobile` currently has no test script, so CI prints a skipped-test message.

### services/api

```powershell
pnpm --filter api format:check
pnpm --filter api lint:ci
pnpm --filter api check-types
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api prisma:deploy
```

Use `DATABASE_URL` pointing at a disposable PostgreSQL database before running
`prisma:deploy`.

### packages/*

```powershell
pnpm --filter @repo/eslint-config --filter @repo/typescript-config format:check
pnpm --filter @repo/eslint-config --filter @repo/typescript-config lint
pnpm --filter @repo/eslint-config --filter @repo/typescript-config check-types
```

Shared packages currently have no test scripts, so CI prints a skipped-test
message.

## Expected CI Jobs

- `web`: format, lint, typecheck, build, test if declared.
- `mobile`: format, lint, typecheck, test if declared.
- `api`: format, lint, typecheck, build, test, e2e test, Prisma migrate deploy.
- `packages`: format, lint, typecheck, test if declared.
- `ci-summary`: final status, including documentation-only or metadata-only
  changes.

## Intentional Failing-Change Checks

Before marking the feature complete, verify each failure category at least once:

- Formatting failure blocks CI and names the format step.
- Lint failure blocks CI and names the lint step.
- Type error blocks CI and names the typecheck step.
- Web or API build failure blocks CI and names the build step.
- API unit or e2e test failure blocks CI and names the test step.
- Broken Prisma migration blocks CI and names the migration deploy step.

## Completion Criteria

- Pull requests show pending status within 2 minutes.
- Typical changes finish required checks within 15 minutes.
- New commits cancel older in-progress runs for the same branch or pull request.
- No workflow step mutates tracked files during validation.
- No secrets or private database URLs appear in logs.
