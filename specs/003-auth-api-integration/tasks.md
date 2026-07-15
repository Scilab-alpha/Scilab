# Tasks: Auth API Integration

**Input**: Design documents from `specs/003-auth-api-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api-contract.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the phase.
- **[Story]**: User story label for story-specific tasks only.

## Phase 1: Setup

- [ ] T001 Align `apps/web/package.json` and the workspace lockfile to the unchanged approved stack from `specs/003-auth-api-integration/plan.md`, including Next.js 15, React 19, Axios, TanStack Query, React Hook Form, Zod, Sonner, Vitest, React Testing Library, and Playwright, then verify the web build and checks still resolve against that baseline
- [ ] T002 Verify `apps/web/package.json` exposes CI-safe `format:check`, `lint`, `check-types`, `test`, and `test:e2e` scripts required by `specs/003-auth-api-integration/quickstart.md`
- [ ] T003 [P] Confirm the web API base URL configuration in `apps/web/src/shared/api/http-client.ts` can target the Swagger-documented Scilab API environment
- [ ] T004 [P] Review existing auth fixtures and test helpers in `apps/web/src/features/auth/testing/auth-test-utils.ts` so tests can model Swagger envelopes without production mock success paths

## Phase 2: Foundational

- [ ] T005 Update auth API request and response types in `apps/web/src/features/auth/types/auth-api.types.ts` to match Swagger: login and refresh return `accessToken` and `refreshToken`, register accepts `firstname`, `lastname`, `gender`, and `dataofbirth`, and `/auth/me` differs from `/users/me`
- [ ] T006 Update auth session and user domain types in `apps/web/src/features/auth/types/auth.types.ts` so `expiresAt` is optional/derived only and full-profile fields are not required for session normalization
- [ ] T007 Update registration result types in `apps/web/src/features/auth/types/register.types.ts` so registration reflects a created user plus a later login token pair, not registration tokens
- [ ] T008 Update the shared HTTP client session helper in `apps/web/src/shared/api/http-client.ts` so token persistence does not assume Swagger returns `expiresAt`
- [ ] T009 Update auth mappers in `apps/web/src/features/auth/api/auth-mappers.ts` to normalize uppercase Swagger roles and optional `/auth/me` versus `/users/me` profile fields
- [ ] T010 Update token storage helpers in `apps/web/src/features/auth/api/auth-token-storage.ts` to persist only the session material supported by the Swagger token pair and to clear legacy demo keys
- [ ] T011 [P] Add or update API envelope fixtures in `apps/web/src/features/auth/testing/auth-test-utils.ts` for login, register, refresh, `/auth/me`, `/users/me`, logout, and failure envelopes
- [ ] T012 [P] During foundational cleanup, search production auth code in `apps/web/src/features/auth` for demo-only imports and remove or isolate mock success paths before story implementation begins

## Phase 3: User Story 1 - API-backed Login

**Goal**: A visitor signs in through `/auth/login`, loads the current user through `/auth/me`, and never authenticates from demo credentials.
**Independent Test**: Mocked Swagger login success creates a session only after API confirmation; 400/401/403 failures show safe feedback; removed demo credentials fail unless the real API accepts them.

- [ ] T013 [P] [US1] Update login API and error-normalization tests in `apps/web/src/features/auth/api/auth.api.test.ts` and `apps/web/src/features/auth/api/auth-errors.test.ts` for Swagger `/auth/login` success without `expiresAt`, 400 missing credentials, 401 authentication failed, 403 account blocked, network unavailable, timeout, and unexpected non-envelope responses with user-safe retry behavior
- [ ] T014 [P] [US1] Update auth provider login tests in `apps/web/src/providers/auth-provider.test.tsx` to assert login saves the token pair, calls `/auth/me`, maps role-based redirect, and clears auth state on failure
- [ ] T015 [P] [US1] Update login screen tests in `apps/web/src/features/auth/components/LoginScreen.test.tsx` for disabled submit, visible loading, safe API errors, successful navigation, and demo credential rejection
- [ ] T016 [US1] Update login API implementation in `apps/web/src/features/auth/api/auth.api.ts` to call `POST /auth/login`, unwrap the standard envelope, and save only the returned token pair
- [ ] T017 [US1] Update login state handling in `apps/web/src/providers/auth-provider.tsx` to call `getCurrentUser()` after token save and derive post-login navigation from the mapped Swagger role
- [ ] T018 [US1] Update login UI behavior in `apps/web/src/features/auth/components/LoginScreen.tsx` to remove user-facing demo credential guidance and present plain-language Swagger API errors
- [ ] T019 [US1] Verify login submit accessibility states in `apps/web/src/features/auth/components/LoginScreen.tsx`, including disabled controls, focus behavior, live feedback, and no duplicate submissions

## Phase 4: User Story 2 - API-backed Registration

**Goal**: A visitor creates a student account through `/auth/register`, then signs in through `/auth/login` when the product flow should continue into an authenticated session.
**Independent Test**: Registration success requires Swagger API confirmation; duplicate and invalid input failures map to user-safe field or form feedback; local fixture registration cannot create a session.

- [ ] T020 [P] [US2] Update register API tests in `apps/web/src/features/auth/api/register.api.test.ts` for Swagger `POST /auth/register` 201 created-user response, 400 invalid input, and 409 duplicate email
- [ ] T021 [P] [US2] Update registration screen tests in `apps/web/src/features/auth/components/RegisterScreen.test.tsx` for first name, last name, gender, date of birth, duplicate email, disabled submit, safe global error, and no fixture-only success
- [ ] T022 [P] [US2] Update registration schema tests or schema coverage for `apps/web/src/shared/schemas/register.schema.ts` to validate the Swagger-required user-facing fields and confirm-password behavior
- [ ] T023 [US2] Update register payload mapping in `apps/web/src/features/auth/api/auth.api.ts` so UI `firstName`, `lastName`, `gender`, and `dateOfBirth` map to Swagger `firstname`, `lastname`, `gender`, and `dataofbirth`
- [ ] T024 [US2] Update registration workflow in `apps/web/src/features/auth/api/register.api.ts` to treat register success as a created user, then call `/auth/login` and `/auth/me` only when creating an authenticated session
- [ ] T025 [US2] Update registration form fields in `apps/web/src/features/auth/components/RegisterScreen.tsx` to collect first name, last name, gender, and date of birth directly instead of deriving backend fields from display text
- [ ] T026 [US2] Update registration validation and field error rendering in `apps/web/src/features/auth/components/RegisterScreen.tsx` and `apps/web/src/shared/schemas/register.schema.ts` for API field names, `aria-invalid`, `aria-describedby`, and live feedback
- [ ] T027 [US2] Remove production fixture registration paths in `apps/web/src/features/auth/api/register.fixtures.ts` and ensure any remaining fixture data is test-only through `apps/web/src/features/auth/testing/auth-test-utils.ts`

## Phase 5: User Story 3 - Session Restoration, Current Profile, Protected Routes, and Logout

**Goal**: Authenticated state across refreshes, current user lookup, protected routes, role checks, profile reads, and logout comes from Swagger-backed session data.
**Independent Test**: A valid stored token restores via `/auth/me`; expired access can refresh via `/auth/refresh`; invalid sessions clear auth; `/users/me` provides full profile only when needed; logout clears local state after `/auth/logout` or 401.

- [ ] T028 [P] [US3] Update auth provider tests in `apps/web/src/providers/auth-provider.test.tsx` for `/auth/me` restore success, `/auth/refresh` token-pair success without `expiresAt`, refresh failure cleanup, and logout cleanup, and add profile-loading coverage for `/users/me` in `apps/web/src/features/auth/components/ProfileManagement.test.tsx`
- [ ] T029 [P] [US3] Update route guard tests in `apps/web/src/features/auth/components/RouteGuard.test.tsx` for loading, authenticated, unauthenticated, expired session, and role-denied states using mapped Swagger roles
- [ ] T030 [P] [US3] Update Playwright auth coverage in `apps/web/tests/e2e/auth-session.spec.ts` for login, protected route refresh, expired-session redirect, logout, and no mock auth success
- [ ] T031 [US3] Update current-user API methods in `apps/web/src/features/auth/api/auth.api.ts` so session normalization uses `GET /auth/me` and authenticated account or profile views use `GET /users/me` when they need gender, date of birth, or other full-profile fields
- [ ] T032 [US3] Update session restoration and refresh behavior in `apps/web/src/providers/auth-provider.tsx` to retry `/auth/me` after `/auth/refresh` and clear local auth state on 400/401 refresh failures
- [ ] T033 [US3] Update logout behavior in `apps/web/src/providers/auth-provider.tsx` so `POST /auth/logout` is attempted when an access token exists and local auth state is cleared on success or 401
- [ ] T034 [US3] Update route access and permission usage in `apps/web/src/shared/constants/permissions.ts` and `apps/web/src/shared/constants/route-access.ts` to rely on mapped API roles rather than demo role data
- [ ] T035 [US3] Replace hard-coded identity and profile fields in `apps/web/src/features/auth/components/ProfileManagement.tsx` with loading, success, error, and recovery states backed by `/users/me`, then verify API-backed role labels and logout entry points in `apps/web/src/shared/components/layout/AdminShell.tsx`, `apps/web/src/shared/components/layout/StudentShell.tsx`, and `apps/web/src/shared/components/layout/StudentTopHeader.tsx`

## Phase 6: User Story 4 - Google OAuth Without Mock Success

**Goal**: Google sign-in and registration never authenticate with demo accounts unless a real Swagger OAuth endpoint is added later.
**Independent Test**: Activating Google auth shows an unavailable state or calls a confirmed Swagger OAuth capability, and it never creates a session from demo credentials or fixtures.

- [ ] T036 [P] [US4] Update Google login tests in `apps/web/src/features/auth/components/LoginScreen.test.tsx` to prove the Google action does not call demo credentials or create a session without a real API response
- [ ] T037 [P] [US4] Update Google registration tests in `apps/web/src/features/auth/components/RegisterScreen.test.tsx` to prove the Google action does not create fixture or demo auth state
- [ ] T038 [P] [US4] Update auth API tests in `apps/web/src/features/auth/api/auth.api.test.ts` to assert `getGoogleOAuthAvailability()` reports unavailable while no Swagger OAuth endpoint exists
- [ ] T039 [US4] Update Google login UI behavior in `apps/web/src/features/auth/components/LoginScreen.tsx` to show an unavailable state without storing tokens or calling demo login helpers
- [ ] T040 [US4] Update Google registration UI behavior in `apps/web/src/features/auth/components/RegisterScreen.tsx` to show an unavailable state without storing tokens or creating fixture sessions
- [ ] T041 [US4] If a real Google OAuth endpoint is added, update `specs/003-auth-api-integration/contracts/auth-api-contract.md`, `services/api/src/auth/interfaces/http/auth.swagger.ts`, `services/api/src/auth/interfaces/http/auth.dto.ts`, and `services/api/src/auth/interfaces/http/auth.controller.ts` in the same change

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T042 Run `pnpm --filter web format:check` and document any unrelated pre-existing formatting failures in `specs/003-auth-api-integration/quickstart.md`
- [ ] T043 Run `pnpm --filter web lint`, fix lint issues in affected auth files under `apps/web/src`, and record the result in `specs/003-auth-api-integration/quickstart.md`
- [ ] T044 Run `pnpm --filter web check-types`, fix type errors in affected auth files under `apps/web/src`, and record the result in `specs/003-auth-api-integration/quickstart.md`
- [ ] T045 Run `pnpm --filter web test` and record auth API, auth provider, login, register, route guard, and mock-removal test results in `specs/003-auth-api-integration/quickstart.md`
- [ ] T046 Run `pnpm --filter web test:e2e` and record login, registration, session restoration, logout, and Google-no-mock scenario results in `specs/003-auth-api-integration/quickstart.md`
- [ ] T047 Verify the manual quickstart acceptance flow in `specs/003-auth-api-integration/quickstart.md` against a local or staging Swagger-compatible API environment
- [ ] T048 Measure auth submit feedback within 1 second and valid login outcome within 3 seconds, then document in `specs/003-auth-api-integration/quickstart.md` the target environment plus auth-related bundle delta, render behavior, request count and timing, interaction responsiveness, and confirmation that no unapproved heavy client dependency was added
- [ ] T049 Perform the final release-wide verification for `demo-auth`, `register.fixtures`, `DEMO_ACCOUNTS`, artificial auth waits, and `scholartrend_demo_user`; remove or justify any remaining production references in `apps/web/src` and record the result in `specs/003-auth-api-integration/quickstart.md`
- [ ] T050 Review auth screens for WCAG 2.1 AA labels, focus states, live regions, keyboard flow, contrast, and mobile-first layout in `apps/web/src/features/auth/components/LoginScreen.tsx` and `apps/web/src/features/auth/components/RegisterScreen.tsx`
- [ ] T051 Update implementation evidence and any discovered contract deltas in `specs/003-auth-api-integration/quickstart.md` and `specs/003-auth-api-integration/contracts/auth-api-contract.md`

## Dependencies

- Setup and Foundational phases block all user stories because the shared stack, types, HTTP client, token storage, fixtures, and role mapping must match Swagger before story work is reliable.
- US1 is the MVP because registration, route guards, and session restoration all depend on a trustworthy API-backed login path.
- US2 depends on Phase 2 and can run after US1 API primitives are stable.
- US3 depends on Phase 2 token storage plus US1 login behavior for manual validation.
- US4 depends on Phase 2 API capability decisions and can run in parallel with US2 or US3 when no backend OAuth endpoint exists.
- Final Phase depends on all selected user stories for the release scope.

## Parallel Execution Examples

### US1

```text
T013, T014, and T015 can run in parallel because they touch API, provider, and screen tests.
After the failing tests capture the Swagger behavior, T016 and T017 can proceed before T018-T019 polish UI states.
```

### US2

```text
T020, T021, and T022 can run in parallel because they cover API, screen, and schema behavior.
T023 and T024 can proceed together after the request/response types are updated, then T025-T027 integrate the form and fixture cleanup.
```

### US3

```text
T028, T029, and T030 can run in parallel because they cover provider, guard, and e2e behavior.
T031-T033 share auth flow dependencies; T034 and T035 can follow independently after role mapping is confirmed.
```

### US4

```text
T036, T037, and T038 can run in parallel because they touch login screen, register screen, and API availability tests.
T039 and T040 can then update each UI path independently.
```

## Implementation Strategy

Deliver the MVP through Phase 1, Phase 2, and US1 first: Swagger-backed login
with regression tests proving demo credentials no longer authenticate. Then add
Swagger-backed registration, session/protected-route/logout behavior, and Google
OAuth mock removal. Finish with validation, accessibility, performance evidence,
and contract documentation updates.
