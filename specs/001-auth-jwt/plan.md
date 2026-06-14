# Implementation Plan: Auth JWT Module

**Branch**: `feat/auth-jwt` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-auth-jwt/spec.md`

## Summary

Add an authentication module to `services/api` so active registered users can
sign in with credentials, receive access and refresh tokens, refresh tokens
during an active session, access protected features through bearer
authentication, and sign out so the current session is revoked. The plan uses
the existing NestJS API, Prisma/PostgreSQL user model, and a Clean Architecture
layout inside the auth module.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js >=18, NestJS 11

**Primary Dependencies**: NestJS, Prisma 7, PostgreSQL, Jest, Supertest,
planned additions: `@nestjs/jwt` and `argon2`

**Storage**: PostgreSQL via Prisma. Existing `User` table is reused; add an
`AuthSession` table for access-token `jti` revocation, refresh-token hash
storage, refresh rotation, and audit-safe session state. Because this feature is
not a released baseline yet, the `AuthSession` schema is consolidated into
`services/api/prisma/migrations/20260611035000_init_schema/migration.sql`.

**Testing**: Jest unit tests in `services/api/src/**/*.spec.ts`; Supertest e2e
tests in `services/api/test/**/*.e2e-spec.ts`

**Target Platform**: HTTP API backend in `services/api`

**Project Type**: Monorepo web/mobile/API project; this feature changes the API
service only

**Performance Goals**: 95% of valid sign-ins complete in under 10 seconds; valid
protected requests authenticate without user-visible delay

**Constraints**: Must preserve Clean Architecture dependencies; all API
responses must use the shared `{ success, message, data }` envelope; sign-in
and refresh response `data` must contain only `accessToken` and `refreshToken`;
access tokens expire after 30 minutes; refresh tokens expire after 30 days; JWT
logout must invalidate the current session; secrets and raw tokens must not be
logged or stored; implementation must follow TDD

**Scale/Scope**: Single auth module for existing users. Registration, password
reset, MFA, social login, and role-based authorization are out of scope.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Branch name follows Angular Conventional Commits branch format:
  `feat/auth-jwt` uses an allowed type and kebab-case description. PASS.
- Backend work preserves Clean Architecture layers and inward dependency
  direction with `domain`, `application`, `infrastructure`, and `interfaces`
  folders inside `services/api/src/auth`. PASS.
- Backend API responses use the shared response envelope through
  `services/api/src/shared/response`. PASS.
- Backend schema changes are consolidated into the active feature migration
  `services/api/prisma/migrations/20260611035000_init_schema/migration.sql`
  instead of a follow-up migration directory. PASS.
- Implementation plan follows TDD: tests are defined before production code in
  data model, contracts, and quickstart validation. PASS.
- No justified constitution violations are present. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-jwt/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- openapi.yaml
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
services/api/
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- auth/
|   |   |-- domain/
|   |   |   |-- entities/
|   |   |   |-- services/
|   |   |   `-- value-objects/
|   |   |-- application/
|   |   |   |-- ports/
|   |   |   `-- use-cases/
|   |   |-- infrastructure/
|   |   |   |-- crypto/
|   |   |   |-- jwt/
|   |   |   `-- persistence/
|   |   |-- interfaces/
|   |   |   |-- http/
|   |   |   |-- guards/
|   |   |   `-- decorators/
|   |   `-- auth.module.ts
|   |-- shared/
|   |   `-- response/
|   |       |-- api-response.type.ts
|   |       |-- response.factory.ts
|   |       |-- response.interceptor.ts
|   |       `-- http-exception.filter.ts
|   |-- app.module.ts
|   `-- prisma/
`-- test/
    `-- auth.e2e-spec.ts
```

**Structure Decision**: Keep the feature inside the existing NestJS API service
at `services/api`. Use module-local Clean Architecture layers so domain and
application code stay independent from NestJS, Prisma, and JWT libraries.

## Phase 0: Research

Research completed in [research.md](./research.md). Key decisions:

- Use JWT bearer tokens in the `Authorization` header for authenticated
  requests.
- Use a persisted session record keyed by access-token `jti` plus a hashed
  refresh token to support sign-out invalidation and token refresh.
- Use `argon2` for password hash verification against `User.password`.
- Use custom NestJS guards/adapters around application ports instead of placing
  framework dependencies in domain/application logic.
- Use a shared response formatter so controllers and exception handling return
  the standard `{ success, message, data }` envelope.

## Phase 1: Design & Contracts

Design artifacts generated:

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- Branch naming remains compliant. PASS.
- Design preserves inward dependencies: domain models have no NestJS/Prisma/JWT
  imports; infrastructure implements ports. PASS.
- Design includes shared response formatting under `services/api/src/shared/response`
  and contracts assert the envelope for success and failure responses. PASS.
- Design keeps unreleased schema changes in the consolidated init migration so a
  fresh database receives `User` and `AuthSession` together. PASS.
- TDD path is explicit: quickstart and future tasks begin with failing unit and
  e2e tests before implementation. PASS.

## Complexity Tracking

No constitution violations.
