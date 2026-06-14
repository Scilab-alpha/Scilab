# Tasks: Auth JWT Module

**Input**: Design documents from `/specs/001-auth-jwt/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Tests are REQUIRED by the constitution and by TE-001 through TE-005. Write each test task first and verify it fails before implementing the corresponding production code.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks
- **[Story]**: User story label for story-specific tasks only
- Every task includes an exact target file or directory path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare dependencies, configuration, and module folders needed by all auth stories.

- [x] T001 Add planned auth dependencies `@nestjs/jwt` and `argon2` in `services/api/package.json`
- [x] T002 Add JWT and refresh-token environment placeholders in `services/api/.env.example`
- [x] T003 [P] Create auth Clean Architecture directories under `services/api/src/auth/domain`, `services/api/src/auth/application`, `services/api/src/auth/infrastructure`, and `services/api/src/auth/interfaces`
- [x] T004 [P] Create shared response directory `services/api/src/shared/response`
- [x] T005 [P] Create auth e2e test scaffold in `services/api/test/auth.e2e-spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish database schema, shared response envelope, auth contracts, and application ports that every user story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Add failing unit tests for API response success and failure envelopes in `services/api/src/shared/response/response.factory.spec.ts`
- [x] T007 Implement shared API response types and factory in `services/api/src/shared/response/api-response.type.ts` and `services/api/src/shared/response/response.factory.ts`
- [x] T008 Add failing unit tests for exception envelope conversion in `services/api/src/shared/response/http-exception.filter.spec.ts`
- [x] T009 Implement response interceptor and HTTP exception filter in `services/api/src/shared/response/response.interceptor.ts` and `services/api/src/shared/response/http-exception.filter.ts`
- [x] T010 Add `AuthSession` model and `User.authSessions` relation in `services/api/prisma/schema.prisma`
- [x] T011 Consolidate `auth_session` unique hashes, expirations, revocation fields, indexes, and foreign key into `services/api/prisma/migrations/20260611035000_init_schema/migration.sql`
- [x] T012 [P] Define auth domain errors and safe failure reasons in `services/api/src/auth/domain/auth.errors.ts`
- [x] T013 [P] Define auth domain enums and event types in `services/api/src/auth/domain/auth-event.ts`
- [x] T014 [P] Define application ports for users, sessions, password hashing, token issuance, and audit logging in `services/api/src/auth/application/ports/auth.ports.ts`
- [x] T015 [P] Define auth configuration constants for 30-minute access tokens and 30-day refresh tokens in `services/api/src/auth/application/auth.constants.ts`
- [x] T016 Wire shared response interceptor and exception filter globally in `services/api/src/main.ts`

**Checkpoint**: Foundation ready - the auth module can now be built story by story.

---

## Phase 3: User Story 1 - Sign In With Credentials (Priority: P1) MVP

**Goal**: Active registered users can sign in with valid credentials and receive only `accessToken` and `refreshToken` in the response `data`.

**Independent Test**: Submit valid credentials to `POST /auth/login` and verify the standard envelope contains exactly `data.accessToken` and `data.refreshToken`; submit invalid or inactive credentials and verify safe failure envelopes.

### Tests for User Story 1

- [x] T017 [P] [US1] Add failing unit tests for valid credentials, invalid credentials, inactive accounts, and token TTLs in `services/api/src/auth/application/use-cases/sign-in.use-case.spec.ts`
- [x] T018 [P] [US1] Add failing e2e tests for `POST /auth/login` success, generic invalid-credential failure, inactive-account failure, and exact token-pair `data` keys in `services/api/test/auth.e2e-spec.ts`

### Implementation for User Story 1

- [x] T019 [P] [US1] Create `AuthSession` domain entity in `services/api/src/auth/domain/entities/auth-session.entity.ts`
- [x] T020 [P] [US1] Create token-pair value object in `services/api/src/auth/domain/value-objects/token-pair.value-object.ts`
- [x] T021 [US1] Implement `SignInUseCase` with audit events and generic failures in `services/api/src/auth/application/use-cases/sign-in.use-case.ts`
- [x] T022 [US1] Implement Prisma user repository for case-insensitive email lookup in `services/api/src/auth/infrastructure/persistence/prisma-user.repository.ts`
- [x] T023 [US1] Implement Prisma session repository create and hash lookup methods in `services/api/src/auth/infrastructure/persistence/prisma-session.repository.ts`
- [x] T024 [US1] Implement Argon2 password hasher adapter in `services/api/src/auth/infrastructure/crypto/argon2-password-hasher.ts`
- [x] T025 [US1] Implement JWT token issuer with `sub`, `jti`, `iat`, `exp`, and `role` claims in `services/api/src/auth/infrastructure/jwt/jwt-token.service.ts`
- [x] T026 [US1] Implement login DTO and auth controller login action in `services/api/src/auth/interfaces/http/auth.controller.ts`
- [x] T027 [US1] Wire providers and imports in `services/api/src/auth/auth.module.ts` and `services/api/src/app.module.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Refresh Authentication Tokens (Priority: P2)

**Goal**: Users can exchange a valid refresh token for a newly rotated access-token and refresh-token pair.

**Independent Test**: Submit a valid refresh token to `POST /auth/refresh` and verify a new token pair; submit expired, revoked, malformed, or reused refresh tokens and verify safe denial envelopes.

### Tests for User Story 2

- [x] T028 [P] [US2] Add failing unit tests for refresh success, expired token denial, revoked token denial, malformed token denial, and rotation reuse denial in `services/api/src/auth/application/use-cases/refresh-tokens.use-case.spec.ts`
- [x] T029 [P] [US2] Add failing e2e tests for `POST /auth/refresh` token-pair response and rejected expired, revoked, malformed, or reused refresh tokens in `services/api/test/auth.e2e-spec.ts`

### Implementation for User Story 2

- [x] T030 [P] [US2] Create refresh-token value object and hashing helpers in `services/api/src/auth/domain/value-objects/refresh-token.value-object.ts`
- [x] T031 [US2] Implement `RefreshTokensUseCase` with refresh rotation, session expiry checks, and audit events in `services/api/src/auth/application/use-cases/refresh-tokens.use-case.ts`
- [x] T032 [US2] Extend Prisma session repository with refresh-token rotation and revocation-on-reuse methods in `services/api/src/auth/infrastructure/persistence/prisma-session.repository.ts`
- [x] T033 [US2] Implement refresh DTO and auth controller refresh action in `services/api/src/auth/interfaces/http/auth.controller.ts`
- [x] T034 [US2] Wire refresh use case provider in `services/api/src/auth/auth.module.ts`

**Checkpoint**: User Stories 1 and 2 both work independently through login and refresh flows.

---

## Phase 5: User Story 3 - Access Protected Features (Priority: P3)

**Goal**: Protected API handlers can require a valid bearer access token and receive the authenticated user's identity.

**Independent Test**: Call `GET /auth/me` with a valid token, no token, an expired token, a malformed token, and a token for an inactive or missing user.

### Tests for User Story 3

- [x] T035 [P] [US3] Add failing unit tests for valid access tokens, missing tokens, expired tokens, revoked sessions, inactive users, and missing users in `services/api/src/auth/application/use-cases/validate-access-token.use-case.spec.ts`
- [x] T036 [P] [US3] Add failing e2e tests for `GET /auth/me` valid bearer access and standard-envelope denial cases in `services/api/test/auth.e2e-spec.ts`

### Implementation for User Story 3

- [x] T037 [US3] Implement `ValidateAccessTokenUseCase` with session and user status checks in `services/api/src/auth/application/use-cases/validate-access-token.use-case.ts`
- [x] T038 [US3] Implement `GetCurrentUserUseCase` in `services/api/src/auth/application/use-cases/get-current-user.use-case.ts`
- [x] T039 [US3] Extend JWT infrastructure with access-token verification in `services/api/src/auth/infrastructure/jwt/jwt-token.service.ts`
- [x] T040 [US3] Implement JWT auth guard in `services/api/src/auth/interfaces/guards/jwt-auth.guard.ts`
- [x] T041 [P] [US3] Implement current-user decorator in `services/api/src/auth/interfaces/decorators/current-user.decorator.ts`
- [x] T042 [US3] Implement auth controller `GET /auth/me` action in `services/api/src/auth/interfaces/http/auth.controller.ts`
- [x] T043 [US3] Wire protected-access providers in `services/api/src/auth/auth.module.ts`

**Checkpoint**: Protected access can be validated independently through `GET /auth/me`.

---

## Phase 6: User Story 4 - End Authenticated Session (Priority: P4)

**Goal**: Users can sign out so the current access token and refresh token can no longer be reused.

**Independent Test**: Sign in, call `POST /auth/logout`, then verify the prior access token fails on `GET /auth/me` and the prior refresh token fails on `POST /auth/refresh`.

### Tests for User Story 4

- [x] T044 [P] [US4] Add failing unit tests for sign-out revocation, repeated sign-out idempotency, and audit events in `services/api/src/auth/application/use-cases/sign-out.use-case.spec.ts`
- [x] T045 [P] [US4] Add failing e2e tests for `POST /auth/logout` and post-logout access-token and refresh-token denial in `services/api/test/auth.e2e-spec.ts`

### Implementation for User Story 4

- [x] T046 [US4] Implement `SignOutUseCase` with current-session revocation and safe idempotency in `services/api/src/auth/application/use-cases/sign-out.use-case.ts`
- [x] T047 [US4] Extend Prisma session repository with access-token revocation lookup by hashed `jti` in `services/api/src/auth/infrastructure/persistence/prisma-session.repository.ts`
- [x] T048 [US4] Implement auth controller logout action protected by the JWT guard in `services/api/src/auth/interfaces/http/auth.controller.ts`
- [x] T049 [US4] Wire sign-out provider in `services/api/src/auth/auth.module.ts`

**Checkpoint**: Login, refresh, protected access, and logout all work independently and together.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finish integration, documentation, safety checks, and validation across all stories.

- [x] T050 [P] Add Swagger bearer auth metadata and auth response schemas in `services/api/src/auth/interfaces/http/auth.swagger.ts`
- [x] T051 [P] Add safe structured auth event logger adapter in `services/api/src/auth/infrastructure/audit/structured-auth-event-logger.ts`
- [x] T052 Update Prisma seed data with an active test user and hashed password in `services/api/prisma/seed.ts`
- [x] T053 [P] Update auth quickstart notes with implemented endpoint behavior in `specs/001-auth-jwt/quickstart.md`
- [x] T054 Run and fix `pnpm --filter api test -- auth` for auth unit tests in `services/api/src/auth`
- [x] T055 Run and fix `pnpm --filter api test:e2e -- auth` for auth e2e tests in `services/api/test/auth.e2e-spec.ts`
- [x] T056 Run and fix `pnpm --filter api lint` for API linting in `services/api`
- [x] T057 Run and fix `pnpm --filter api build` for API compilation in `services/api`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks every user story
- **User Story 1 (Phase 3)**: Depends on Foundational completion and is the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational completion; practically easiest after User Story 1 because it needs an issued refresh token
- **User Story 3 (Phase 5)**: Depends on Foundational completion; practically easiest after User Story 1 because it needs an issued access token
- **User Story 4 (Phase 6)**: Depends on User Stories 1, 2, and 3 for full invalidation verification
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 Sign In (P1)**: MVP and first deliverable
- **US2 Refresh Tokens (P2)**: Can be developed after the shared session repository exists; uses token/session behavior introduced by US1
- **US3 Protected Access (P3)**: Can be developed after token issuance exists; validates access-token sessions
- **US4 Sign Out (P4)**: Should follow US2 and US3 so revocation can be verified against both access and refresh flows

### Within Each User Story

- Tests MUST be written and observed failing before production code starts
- Domain/value objects before application use cases
- Application ports/use cases before infrastructure adapters
- Infrastructure adapters before controller/guard wiring when needed
- Controller and guard work must return the shared `{ success, message, data }` envelope
- Refactor only after the story tests pass

### Parallel Opportunities

- T003, T004, and T005 can run in parallel during setup
- T012, T013, T014, and T015 can run in parallel during foundation
- Each story's unit and e2e test tasks marked `[P]` can be written in parallel
- US2 and US3 can start in parallel after US1 has token issuance and session persistence working
- Swagger/audit docs tasks T050, T051, and T053 can run in parallel after the endpoint shapes settle

---

## Parallel Example: User Story 1

```bash
# Write failing tests together:
Task: "T017 [P] [US1] Add failing unit tests for valid credentials, invalid credentials, inactive accounts, and token TTLs in services/api/src/auth/application/use-cases/sign-in.use-case.spec.ts"
Task: "T018 [P] [US1] Add failing e2e tests for POST /auth/login success, generic invalid-credential failure, inactive-account failure, and exact token-pair data keys in services/api/test/auth.e2e-spec.ts"

# Build independent domain pieces together:
Task: "T019 [P] [US1] Create AuthSession domain entity in services/api/src/auth/domain/entities/auth-session.entity.ts"
Task: "T020 [P] [US1] Create token-pair value object in services/api/src/auth/domain/value-objects/token-pair.value-object.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T028 [P] [US2] Add failing unit tests for refresh success, expired token denial, revoked token denial, malformed token denial, and rotation reuse denial in services/api/src/auth/application/use-cases/refresh-tokens.use-case.spec.ts"
Task: "T029 [P] [US2] Add failing e2e tests for POST /auth/refresh token-pair response and rejected expired, revoked, malformed, or reused refresh tokens in services/api/test/auth.e2e-spec.ts"
Task: "T030 [P] [US2] Create refresh-token value object and hashing helpers in services/api/src/auth/domain/value-objects/refresh-token.value-object.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T035 [P] [US3] Add failing unit tests for valid access tokens, missing tokens, expired tokens, revoked sessions, inactive users, and missing users in services/api/src/auth/application/use-cases/validate-access-token.use-case.spec.ts"
Task: "T036 [P] [US3] Add failing e2e tests for GET /auth/me valid bearer access and standard-envelope denial cases in services/api/test/auth.e2e-spec.ts"
Task: "T041 [P] [US3] Implement current-user decorator in services/api/src/auth/interfaces/decorators/current-user.decorator.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Write and observe failing US1 tests.
3. Implement US1 until unit and e2e tests pass.
4. Validate that `POST /auth/login` returns only `accessToken` and `refreshToken` in `data`.
5. Stop for review before adding refresh, protected access, or logout.

### Incremental Delivery

1. Deliver login as the MVP.
2. Add refresh rotation without changing the login response contract.
3. Add protected access using bearer JWT and persisted session validation.
4. Add logout revocation and verify old access and refresh tokens are denied.
5. Run full unit, e2e, lint, and build validation.

### Parallel Team Strategy

1. One developer completes Prisma/session foundation while another completes response-envelope foundation.
2. After US1 is green, one developer can take US2 and another can take US3.
3. US4 should integrate after US2 and US3 because it proves revocation across both token paths.

---

## Notes

- All auth success and failure responses must use `{ success, message, data }`.
- Sign-in and refresh response `data` must contain exactly `accessToken` and `refreshToken`.
- Raw passwords, raw JWTs, raw refresh tokens, and raw `jti` values must never be persisted or logged.
- Domain and application files must not import NestJS, Prisma Client, or JWT library types.
- Access tokens expire after 30 minutes; refresh tokens expire after 30 days.
- Unreleased schema changes must be folded into the active consolidated migration file, not a new migration directory.
