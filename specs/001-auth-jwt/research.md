# Research: Auth JWT Module

## Decision: Use JWT bearer tokens for protected requests

**Rationale**: The feature explicitly requires JWT authentication. NestJS
documentation describes issuing a JWT after username/password authentication and
sending it as a bearer token in the authorization header for subsequent
protected requests. This matches the product requirement and fits API clients
from web and mobile apps.

**Alternatives considered**:

- Server-side cookie session: simpler logout semantics, but does not satisfy the
  explicit JWT requirement.
- API key per user: useful for machine clients, but not appropriate for normal
  user sign-in and sign-out.

**Source**: https://docs.nestjs.com/security/authentication

## Decision: Add persisted session state for logout invalidation and refresh

**Rationale**: The spec requires signed-out sessions to be denied when reused
and clarifies that login responses return both `accessToken` and `refreshToken`.
JWT validation by signature and expiration alone cannot revoke a single active
token before it expires. Each issued access token will include a `jti`; the
system stores a safe hash of that identifier plus a safe hash of the refresh
token with issue/expiration/revocation state. Protected access checks JWT
validity and session state, while token refresh validates the refresh token
against the persisted session.

**Alternatives considered**:

- Very short-lived access tokens only: reduces risk window but fails the
  requirement that users can continue a session with a 30-day refresh token.
- Store raw token strings: easier lookup but unnecessarily increases impact if
  the database is exposed.

## Decision: Return only access and refresh tokens in auth token payloads

**Rationale**: The clarification requires auth response `data` to contain only
`accessToken` and `refreshToken`. The access-token TTL is fixed at 30 minutes
and the refresh-token TTL is fixed at 30 days. TTL values are contract and
configuration rules, not response payload fields.

**Alternatives considered**:

- Include `tokenType`, `expiresIn`, and user profile in `data`: common in many
  APIs, but explicitly rejected by the clarification.
- Put TTL metadata beside `data`: keeps metadata visible, but conflicts with the
  request to return no other auth response content beyond the two tokens.

## Decision: Use custom Clean Architecture ports around JWT, password hashing, and persistence

**Rationale**: The constitution requires domain/application code to avoid
framework and infrastructure dependencies. Application use cases will depend on
ports such as `UserRepository`, `SessionRepository`, `PasswordHasher`, and
`TokenIssuer`. NestJS controllers, guards, Prisma repositories, JWT signing, and
Argon2 verification live in infrastructure/interfaces adapters.

**Alternatives considered**:

- Put all logic in a NestJS service: faster initially, but couples application
  rules to framework and persistence concerns.
- Use Passport directly in use cases: common in NestJS, but still a framework
  integration detail that belongs in adapters for this project.

**Sources**:

- https://docs.nestjs.com/guards
- https://docs.nestjs.com/recipes/passport

## Decision: Use `argon2` for password verification

**Rationale**: The existing `User.password` field stores a password value, and
the feature requires safe credential verification without storing raw secrets.
The implementation will verify submitted secrets against stored hashes through a
`PasswordHasher` port. `argon2` is selected as the planned dependency because it
is purpose-built for password hashing and keeps the application code independent
behind a port.

**Alternatives considered**:

- Plain string comparison: unacceptable because it implies storing or comparing
  raw secrets.
- Bcrypt: acceptable and widely used, but Argon2 is selected for new code unless
  existing data already uses a different hash format.

**Source**: https://www.prisma.io/blog/backend-prisma-typescript-orm-with-postgresql-auth-mngp1ps7kip4

## Decision: Document bearer auth in OpenAPI contract

**Rationale**: The API already uses `@nestjs/swagger` in `main.ts`, and
consumers need a precise contract for login, logout, current user, and protected
access failures. OpenAPI bearer security communicates how clients attach JWTs
without exposing implementation details.

**Alternatives considered**:

- Only document endpoints in prose: insufficient for client and e2e contract
  tests.
- Generate contract after implementation only: conflicts with TDD and
  contract-first planning.

**Sources**:

- https://docs.nestjs.com/openapi/introduction
- https://docs.nestjs.com/openapi/security

## Decision: Use a shared API response formatter

**Rationale**: The constitution requires every backend API response to use
`{ success, message, data }`. A shared formatter under
`services/api/src/shared/response/` prevents each controller from hand-crafting
response bodies and lets exception handling return the same envelope for
failures.

**Alternatives considered**:

- Format responses in every controller: easy to start, but creates duplicated
  response shapes and inconsistent messages.
- Leave errors in framework default shape: conflicts with the required API
  contract and makes clients handle multiple formats.
