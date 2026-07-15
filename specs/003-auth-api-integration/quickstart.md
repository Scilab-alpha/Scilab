# Quickstart: Auth API Integration

## Prerequisites

- Install dependencies with `pnpm install --frozen-lockfile`.
- Ensure the web app points at the Swagger-documented Scilab API base URL for
  the target environment.
- Confirm `apps/web` is aligned to the unchanged approved frontend stack,
  especially Next.js 15, React 19, TailwindCSS v4, Axios, TanStack Query, React Hook Form,
  Zod, Sonner, Vitest, React Testing Library, and Playwright.

## Local Validation Flow

1. Start the API service with its required local database services.
2. Start the web app.
3. Open `/auth/login`.
4. Attempt login with invalid credentials and verify no local session is
   created.
5. Log in with a real API-backed account and verify post-login navigation uses
   the authenticated user role.
6. Refresh a protected route and verify the session is restored through
   `/auth/me` or refreshed through `/auth/refresh` when needed.
7. Open an account or profile view that needs extended user details and verify
   it loads those fields through `/users/me`, not the session-normalization call.
8. Sign out and verify protected routes require authentication again.
9. Open `/auth/register`.
10. Submit invalid registration data and verify field-level feedback.
11. Submit valid registration data and verify the account is created through the
    API.
12. Attempt removed demo credentials and verify they do not authenticate unless
    those accounts exist in the API environment.
13. Use the Google auth control and verify it does not authenticate with a demo
    account. It must call a real OAuth API or present an unavailable state.

## Required Automated Checks

Run the affected workspace checks before completion:

```sh
pnpm --filter web format:check
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web test:e2e
```

If `test` or `test:e2e` is not declared yet for `apps/web`, add CI-safe scripts
using Vitest/React Testing Library and Playwright as part of implementation.

## Acceptance Evidence

- Login and registration success paths fail when the API is unavailable.
- Tests prove fixture-only registration responses are not production behavior.
- Tests prove demo credential login no longer creates an authenticated session.
- API errors are mapped to safe form or toast messages.
- Loading and disabled-submit states are visible during pending auth requests.
- Protected route behavior is correct for valid, expired, and missing sessions.
- Accessibility checks cover labels, names, focus states, live feedback, and
  keyboard operation.
- Performance checks confirm visible auth feedback within 1 second and valid
  login outcome within 3 seconds in the target environment.
- Performance evidence records auth-related bundle impact, render behavior,
  request count and timing, interaction responsiveness, and confirms that no
  unapproved heavy client dependency was added.

## Planning Validation Notes

This planning pass realigns the auth design with the public Swagger contract and
does not by itself prove the implementation. After code is updated or reviewed
against this plan, rerun the automated checks above and update this section with
fresh evidence.

Implementation evidence to capture:

- Login and registration contain no artificial `setTimeout` waits.
- Login submit sets pending UI immediately and only creates auth state after the
  API-backed auth context returns success.
- Registration collects the backend-required `firstname`, `lastname`, `gender`,
  and `dataofbirth` fields, calls `/auth/register`, then calls `/auth/login` to
  obtain access and refresh tokens because registration returns a user only.
- Session restoration calls `/auth/me`, refresh uses `/auth/refresh`, and full
  profile reads use `/users/me` only when those extra fields are needed.
- Session invalidation is based on `/auth/me` and `/auth/refresh` outcomes; the
  client does not assume Swagger supplies `expiresAt` or silently depend on JWT
  expiry decoding.
- Google login and registration show unavailable states unless a real Swagger
  OAuth endpoint exists, and never create a demo or fixture session.
- Manual local/staging API acceptance and real-network 3-second login outcome
  are documented with the target environment used.
