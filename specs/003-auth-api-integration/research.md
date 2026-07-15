# Research: Auth API Integration

## Decision: Use the requested frontend stack as the target baseline

**Rationale**: The user explicitly required a consistent stack across the
frontend project: Next.js 15 App Router, React 19, TypeScript, TailwindCSS v4,
shadcn/ui, Radix UI, Lucide React, React Hook Form, Zod, Axios, TanStack Query,
Zustand for non-auth client state, React Context only for authentication,
Sonner, Vitest, React Testing Library, and Playwright. The current web package
already uses many of these pieces but declares Next `16.2.7` and lacks visible
test scripts, so implementation must include stack alignment work.

**Alternatives considered**:

- Keep the current package versions as-is. Rejected because it conflicts with
  the user's explicit project-wide stack requirement.
- Introduce another state or networking library. Rejected because the requested
  stack already defines the frontend boundary.

## Decision: Keep authentication state in React Context

**Rationale**: The requested architecture reserves React Context for
authentication. The current app already exposes `AuthProvider` and `useAuth`,
so evolving this boundary avoids broad UI churn while replacing the demo-backed
implementation with API-backed session state.

**Alternatives considered**:

- Move auth state to Zustand. Rejected because the user explicitly limited
  Zustand to client state and React Context to authentication.
- Keep local storage demo user state. Rejected because the feature requires
  removing mock auth data.

## Decision: Use a typed Axios auth API layer with interceptors

**Rationale**: Axios with interceptors is part of the required stack and is a
good fit for attaching auth credentials, normalizing the standard API response
envelope, handling refresh attempts, and converting backend failures into
user-safe auth errors. Keeping this in `features/auth/api` preserves the clean
separation between UI, API, business logic, and state.

**Alternatives considered**:

- Use direct `fetch` calls inside components. Rejected because it violates the
  requested typed API layer and separation of concerns.
- Put request handling directly in `AuthProvider`. Rejected because it would
  blur state management with transport details.

## Decision: Use TanStack Query for server-backed session/current-user state

**Rationale**: Current-user lookup, session restoration, and refresh behavior
are server state. TanStack Query provides request caching, loading states,
retry control, and invalidation while leaving the auth context as the public
state boundary consumed by UI.

**Alternatives considered**:

- Store only decoded token data locally. Rejected because protected UI should be
  derived from API-backed session/user data.
- Re-fetch manually in each route guard. Rejected because it duplicates loading
  and error behavior.

## Decision: Use the public Swagger auth contract as the source of truth

**Rationale**: The user asked to redo the auth flow according to the Swagger
link at `https://scilab-api.epsilon.io.vn/api/docs#/`. The confirmed auth
surface is `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`, and
`/auth/logout`, with bearer-protected profile details available at `/users/me`.
Login and refresh return `accessToken` and `refreshToken`; they do not return an
explicit `expiresAt`.

**Alternatives considered**:

- Continue using the earlier inferred contract. Rejected because it included
  fields and assumptions not present in Swagger.
- Use `/users/me` as the only current-user endpoint. Rejected because Swagger
  exposes `/auth/me` specifically for authenticated-user session lookup.

## Decision: Preserve current auth UX while removing mock behavior

**Rationale**: The existing login/register screens already use the product
visual language, TailwindCSS tokens, shadcn/ui-style primitives, Lucide icons,
and Sonner feedback. The change should replace data sources, not redesign the
screen. Loading, disabled-submit, field errors, and toast feedback remain, but
the source of truth becomes the API.

**Alternatives considered**:

- Redesign the auth screens during integration. Rejected as unrelated scope and
  higher risk.
- Leave demo credential helper text. Rejected because it keeps user-facing mock
  guidance in production auth screens.

## Decision: Treat Google OAuth as real-only

**Rationale**: The login screen currently signs in with a demo student account
for Google. The Swagger auth surface exposes register, login, refresh, current
user, and logout, but no visible Google OAuth endpoint. The implementation must
remove demo Google success behavior. If an existing OAuth API contract is found
later, wire to it; otherwise present a clear unavailable state or remove the
button until backend support is planned.

**Alternatives considered**:

- Keep Google button mapped to a demo account. Rejected because it violates the
  no-mock-auth requirement.
- Add a backend OAuth endpoint silently. Rejected because backend endpoint
  changes require a separate contract update and Swagger coverage.

## Decision: Test mock removal as a regression condition

**Rationale**: The main risk is a partial integration where one path still
authenticates from local fixtures. Tests must fail if demo credentials, generated
registered users, fixture registration responses, or artificial waits remain as
production success paths.

**Alternatives considered**:

- Only test happy-path API success. Rejected because it would not prove mock
  data removal.
