# Quickstart: Auth JWT Module

## Prerequisites

- Node.js >=18
- pnpm 9
- PostgreSQL available through `services/api/docker-compose.yml`
- Environment variables from `services/api/.env.example`

## 1. Install planned auth dependencies

```bash
pnpm --filter api add @nestjs/jwt argon2
```

## 2. Start database

```bash
pnpm --filter api db:up
pnpm --filter api prisma:generate
```

## 3. Write failing tests first

Create unit tests before production code:

```bash
pnpm --filter api test -- auth
```

Expected first failures:

- Valid credentials should create an authenticated session.
- Sign-in result data should contain exactly `accessToken` and `refreshToken`.
- Access tokens should expire after 30 minutes.
- Refresh tokens should expire after 30 days.
- Valid refresh tokens should issue a new access/refresh token pair.
- Invalid credentials should return a generic authentication failure.
- Inactive or banned accounts should not receive sessions.
- Revoked, expired, missing, and malformed JWT sessions should be denied.
- API responses should be wrapped in `{ success, message, data }`.

Create e2e/contract tests from `contracts/openapi.yaml` before endpoint
implementation:

```bash
pnpm --filter api test:e2e -- auth
```

Expected first failures:

- `POST /auth/login` returns an envelope whose `data` contains only `accessToken` and `refreshToken`.
- `POST /auth/refresh` returns an envelope whose `data` contains only `accessToken` and `refreshToken`.
- `GET /auth/me` accepts a valid bearer JWT and returns the standard envelope.
- `GET /auth/me` denies requests without a valid bearer JWT using the standard envelope.
- `POST /auth/logout` revokes the current session and returns the standard envelope.
- Reusing the logged-out token is denied using the standard envelope.

## 4. Implement in Clean Architecture order

1. Domain entities and value objects.
2. Application ports and use cases.
3. Infrastructure adapters for Prisma, JWT, and password hashing.
4. Shared response formatter in `services/api/src/shared/response/`.
5. Interface adapters: controller, guard, current-user decorator, DTOs.
6. App module wiring, exception filter/interceptor, and Swagger bearer auth metadata.

Domain and application files must not import NestJS, Prisma Client, or JWT
library types.

Controllers and exception handling must use the shared response formatter for
all success and failure responses.

## 5. Run validation

```bash
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api lint
pnpm --filter api build
```

## 6. Manual API smoke test

Implemented endpoint behavior:

- `POST /auth/login` accepts `{ "email", "password" }` and returns `data` with
  only `accessToken` and `refreshToken`.
- `POST /auth/refresh` accepts `{ "refreshToken" }`, rotates the persisted
  session tokens, and returns the same token-pair data shape.
- `GET /auth/me` requires `Authorization: Bearer <accessToken>`.
- `POST /auth/logout` requires a bearer token and revokes the current session.
- Failed authentication responses use the shared `{ success, message, data }`
  envelope and do not expose token or password details.

Sign in:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Use returned token:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Refresh the token pair:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

Sign out:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

Verify the same token is rejected:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Verify the same refresh token is rejected:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```
