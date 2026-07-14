# Implementation Plan: Auth API Integration

**Branch**: `feature/RegisterScreen` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-auth-api-integration/spec.md`

## Summary

Replace web authentication mock data with the Scilab authentication API
documented at `https://scilab-api.epsilon.io.vn/api/docs#/`. This planning pass
keeps the previously selected frontend technology stack unchanged while
realigning the auth flow to the public Swagger contract. The implementation
will keep authentication state in React Context, move server communication into
a typed Axios API layer, use TanStack Query for server-backed session and
current-user state, preserve existing auth screen UX, and add regression coverage
proving login and registration cannot succeed from local fixtures or demo
accounts.

The previously approved frontend stack remains the target standard for this
feature and future web work: Next.js 15 App Router, React 19, TypeScript,
feature-based modules, TailwindCSS v4, shadcn/ui, Radix UI, Lucide React,
Zustand for client state, React Context only for authentication, TanStack Query
for server state, React Hook Form, Zod, Axios, typed API layers, Sonner,
Vitest, React Testing Library, and Playwright. "Keep the stack unchanged" means
preserving this planned Next.js 15 baseline; bringing a workspace that currently
declares a different Next.js version back to that baseline is dependency
alignment, not adoption of a new stack.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, and Next.js 15 App Router as the
unchanged approved frontend baseline. Current `apps/web/package.json` declares
Next `16.2.7`; implementation must align it to the approved Next.js 15 baseline
and verify the lockfile, build, type checks, and tests before completion.

**Primary Dependencies**: Next.js 15 App Router, React 19, TailwindCSS v4,
shadcn/ui, Radix UI, Lucide React, React Hook Form, Zod, Axios with
interceptors, TanStack Query, Sonner, clsx, tailwind-merge,
class-variance-authority. The consumed Scilab API exposes Swagger endpoints for
student registration, credential login, token refresh, authenticated user
lookup, profile lookup, and logout.

**Storage**: API-backed JWT authentication state. Client state is limited to the
minimum session material needed by the web app and must replace the current
demo local storage user object. Refresh-token handling follows the safest
pattern supported by `/auth/refresh`. Because Swagger does not return an
explicit expiration timestamp, `/auth/me` validation and `/auth/refresh`
success or failure are the authoritative session-validity signals. JWT expiry
decoding is not assumed by this plan.

**Testing**: Vitest and React Testing Library for API adapter, auth context,
form, and route-guard behavior; Playwright for critical login, registration,
session restoration, and logout journeys. If the web workspace does not yet
declare these tools, add CI-safe scripts and dependencies as part of this
feature.

**Target Platform**: `apps/web` auth routes and protected web routes:
`/auth/login`, `/auth/register`, auth provider, route guards, and role-aware
navigation in a mobile-first responsive web experience.

**Project Type**: pnpm monorepo with a Next.js web app and NestJS API service.

**Performance Goals**: Auth submit controls show progress within 1 second;
95% of valid login attempts in development or staging show success navigation
or actionable feedback within 3 seconds; auth integration adds no heavy client
dependency outside the approved stack; protected-route session restoration does
not block the shell longer than necessary and shows meaningful loading feedback.

**Constraints**: No fixture-only auth success paths may remain in production
auth screens. Google OAuth must not authenticate against a demo account; it must
use a Swagger-documented API capability when available or be represented as
unavailable until a real backend contract exists. API errors must be user-safe
and must not expose tokens, stack traces, or internal exception names.
Accessibility must meet WCAG 2.1 AA expectations for form controls, focus
states, messages, and keyboard operation.

**Scale/Scope**: Web auth integration only. Affects `apps/web` auth screens,
auth provider, typed auth API layer, route guards, auth schemas/types, tests,
and possibly frontend dependency/script alignment. Existing Swagger-documented
backend endpoints are consumed but not redesigned unless integration reveals a
missing contract that must be handled separately with OpenAPI/Swagger updates.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Frontend code quality: PASS. Plan uses feature-based modules, typed request
  and response contracts, a typed Axios API layer, separated UI/business/API
  responsibilities, and required lint/type checks.
- Testing standards: PASS. Plan requires regression coverage for removal of
  mock auth success plus component/integration/e2e coverage for auth journeys
  and loading/error/session states.
- UX consistency: PASS. Existing auth layout, shadcn/ui/Radix controls,
  TailwindCSS v4 tokens, Sonner feedback, mobile-first behavior, and WCAG 2.1 AA
  checks are retained.
- Performance requirements: PASS. Plan defines progress, login feedback,
  dependency, and session restoration budgets.
- Backend API contract rule: PASS/N/A. The plan consumes existing auth
  endpoints. Any backend endpoint change discovered during implementation must
  update OpenAPI/Swagger in the same change.
- Backend responsibility separation: PASS/N/A. No backend use-case changes are
  planned. If backend work becomes necessary, DTOs, specs, and use cases remain
  in dedicated `*.dto.ts`, `*.spec.ts`, and `*.use-case.ts` files.
- No unjustified constitution violations are present: PASS.

## Project Structure

### Documentation

```text
specs/003-auth-api-integration/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- auth-api-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md             # Dependency-ordered implementation tasks
```

### Source Code

```text
apps/web/
|-- package.json
|-- src/app/auth/login/page.tsx
|-- src/app/auth/register/page.tsx
|-- src/features/auth/
|   |-- api/
|   |-- components/
|   |-- types/
|   `-- views/
|-- src/providers/auth-provider.tsx
|-- src/shared/schemas/register.schema.ts
|-- src/shared/constants/routes.ts
|-- src/shared/constants/permissions.ts
`-- tests or co-located *.test.ts(x) files

services/api/
|-- src/auth/interfaces/http/auth.controller.ts
|-- src/auth/interfaces/http/auth.dto.ts
|-- src/auth/interfaces/http/auth.swagger.ts
`-- test/auth.e2e-spec.ts
```

**Structure Decision**: Keep auth UI in `apps/web/src/features/auth`, put all
HTTP calls and mappers in `features/auth/api`, keep authentication state in
`src/providers/auth-provider.tsx`, and avoid introducing feature data access
inside visual components. Tests should sit near the code or in the existing web
test location once the project test convention is confirmed.

## Phase 0: Research

Research completed in [research.md](./research.md). Key decisions:

- Use a typed Axios client with interceptors for API envelope unwrapping,
  auth-token attachment, refresh handling, and user-safe error normalization.
- Use React Context as the single auth state boundary and TanStack Query for
  server-backed current-user/session validation.
- Replace `demo-auth.ts`, `register.fixtures.ts`, and artificial waits with real
  API calls and typed test doubles only in tests.
- Preserve React Hook Form and Zod form validation, mapping API field errors
  back onto form fields without duplicating backend policy in UI copy.
- Use the public Swagger auth contract as the source of truth:
  `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`,
  and `/users/me` for full profile details.
- Treat Google OAuth as real-only: use a Swagger-documented API if a contract
  exists; otherwise remove demo success behavior and present an unavailable
  state until backend support is added.
- Align `apps/web` dependency versions and scripts with the requested stack,
  including Next.js 15, Vitest, React Testing Library, and Playwright if absent.

## Phase 1: Design & Contracts

Design artifacts generated:

- [data-model.md](./data-model.md)
- [contracts/auth-api-contract.md](./contracts/auth-api-contract.md)
- [quickstart.md](./quickstart.md)

The design models API-backed auth requests, auth sessions, authenticated users,
and normalized auth errors. Contracts describe the Swagger-documented auth
surface the web app must consume, note that login and refresh return token pairs
without `expiresAt`, and identify Google OAuth as unavailable unless a real
Swagger endpoint is confirmed.

## Post-Design Constitution Check

- Frontend code quality: PASS. Design separates UI, API transport, auth context,
  schemas, typed models, and tests.
- Testing standards: PASS. Quickstart and contract notes include Vitest/RTL and
  Playwright coverage for success, failure, session restoration, and mock-removal
  regressions.
- UX consistency: PASS. Design keeps current screen structure and requires
  loading, disabled-submit, error, recovery, keyboard, focus, and contrast
  validation.
- Performance requirements: PASS. Design includes submit-feedback, 3-second
  valid-login feedback, dependency, and session restoration checks.
- Backend API contract rule: PASS/N/A. Current design consumes existing
  Swagger-documented endpoints. Any Google OAuth or backend shape change must
  update Swagger.
- Backend responsibility separation: PASS/N/A. No backend use-case
  implementation change is planned in this phase.
- No unjustified constitution violations are present: PASS.

## Complexity Tracking

No constitution violations.
