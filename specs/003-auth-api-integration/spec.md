# Feature Specification: Auth API Integration

**Feature Branch**: `feature/RegisterScreen`
**Created**: 2026-07-08
**Status**: Ready for Implementation
**Input**: User description: "Rework the web auth flow according to the public Swagger API at https://scilab-api.epsilon.io.vn/api/docs#/"

## User Scenarios & Testing

### Primary User Story

A web user signs in, registers, restores their authenticated session, views the
current account, and signs out through the existing product authentication
screens using the Scilab Swagger-documented API instead of demo accounts, local
fixtures, or hard-coded mock responses.

### Acceptance Scenarios

1. **Given** a visitor is on the login screen with valid credentials for an
   existing account, **When** they submit the form, **Then** the app authenticates
   through the Swagger-documented login contract, stores the returned access and
   refresh credentials securely for the web experience, loads the current user,
   and routes the user to the correct post-login destination.
2. **Given** a visitor is on the login screen with invalid credentials, **When**
   they submit the form, **Then** the app shows a clear authentication error and
   does not create a local authenticated session.
3. **Given** a visitor is on the registration screen with valid account details,
   **When** they submit the form, **Then** the account is created through the
   Swagger-documented registration contract and the user can continue through
   the real sign-in flow.
4. **Given** a visitor attempts to register with an email that already exists or
   invalid account details, **When** the API rejects the request, **Then** the
   relevant form fields and summary feedback show the API-provided failure in a
   user-friendly way.
5. **Given** an authenticated user refreshes a protected page, **When** the app
   initializes, **Then** it refreshes or validates the session through the
   Swagger-documented auth endpoints and does not fall back to demo account
   data.
6. **Given** an authenticated user signs out, **When** sign-out completes,
   **Then** the app ends the API-backed session, clears client auth state, and
   returns the user to an unauthenticated screen.
7. **Given** an authenticated user opens an account or profile view that needs
   details beyond the auth identity, **When** the app loads that view, **Then**
   it retrieves the full profile through `/users/me` while continuing to use
   `/auth/me` for session restoration and authorization state.

### Edge Cases

- API is unavailable, times out, or returns an unexpected error while the user is
  logging in, registering, loading the current user, refreshing a session, or
  signing out.
- The session is expired, revoked, malformed, or missing during app startup or
  protected-route access.
- The API returns field-level validation errors that do not exactly match the
  current form labels.
- The user submits the auth form multiple times before the first request
  completes.
- Existing demo credentials or fixture-only accounts are attempted after mock
  data is removed.

## Requirements

### Functional Requirements

- **FR-001**: The web auth screens MUST stop using demo accounts, local fixture
  responses, artificial network delays, or generated mock users for login,
  registration, session restoration, current-user lookup, and sign-out.
- **FR-002**: The web app MUST use the Swagger-documented Scilab authentication
  API for login, registration, session refresh, current user retrieval, and
  sign-out.
- **FR-003**: The login flow MUST create an authenticated web session only after
  the API confirms authentication success.
- **FR-004**: The registration flow MUST create student accounts through the API
  and MUST not synthesize successful registration responses locally.
- **FR-005**: The app MUST translate API success and failure envelopes into the
  auth screen state users see, including form-level and field-level feedback.
- **FR-006**: Protected auth state MUST be derived from API-backed access token,
  refresh token, and current-user data, not from persisted demo user objects.
- **FR-007**: Sign-out MUST notify the API when an authenticated session exists
  and MUST clear local auth state after completion or confirmed invalid session.
- **FR-008**: The user role and post-auth navigation MUST be based on the
  authenticated user data returned by the API or current-user lookup.
- **FR-009**: Mock-only auth data and user-facing demo credential guidance MUST
  be removed from production auth screens.
- **FR-010**: The feature MUST preserve existing auth form validation rules
  unless the API contract requires stricter user-facing validation.

### UX, Accessibility, and Consistency Requirements

- **UX-001**: The experience MUST reuse established product layout, controls,
  copy tone, spacing, focus behavior, and responsive conventions.
- **UX-002**: User-visible workflows MUST define loading, empty, error,
  validation, and recovery states where applicable.
- **UX-003**: Interactive elements MUST be keyboard-accessible, have discernible
  names, visible focus states, semantic structure, and usable contrast.
- **UX-004**: Auth submit controls MUST prevent duplicate submissions while a
  request is in progress and MUST provide visible progress feedback.
- **UX-005**: API failures MUST be presented in plain language without exposing
  tokens, stack traces, internal exception names, or sensitive account details.

### Quality and Testing Requirements

- **QT-001**: User-visible auth behavior MUST be covered by the lowest reliable
  test level, with end-to-end coverage for the critical login and registration
  journeys.
- **QT-002**: Removing mock auth behavior MUST include regression coverage that
  fails if login or registration can succeed using fixture-only data.
- **QT-003**: Tests MUST cover successful login, failed login, successful
  registration, duplicate or invalid registration, session restoration, expired
  or invalid session handling, and sign-out.
- **QT-004**: Tests MUST cover loading, disabled-submit, error, and recovery
  states for auth screens.

### Performance Requirements

- **PF-001**: Important user journeys MUST define measurable loading and
  interaction budgets.
- **PF-002**: New client code, network calls, images, and dependencies MUST be
  assessed for bundle, render, network, and responsiveness impact.
- **PF-003**: Auth form submission MUST show visible feedback within 1 second of
  user action under normal development or staging conditions.
- **PF-004**: Auth integration MUST not add new heavy client dependencies unless
  the plan documents why the existing project tooling cannot satisfy the need.

## Key Entities

- **Auth Session**: The authenticated state for a web user, including access
  credentials, refresh credentials, derived expiration or invalid-session state,
  and the ability to end the session.
- **Authenticated User**: The user identity returned by the API, including
  email, status, role, profile names, and any display data required by the web
  shell.
- **Auth Request**: A login, registration, refresh, current-user, or sign-out
  action initiated by the web auth screens.
- **Auth Error**: A user-safe representation of API validation,
  authentication, authorization, network, or unexpected failures.

## Success Criteria

- **SC-001**: 100% of successful login and registration attempts in the web auth
  screens are confirmed by the Swagger-documented Scilab API rather than local
  fixture data.
- **SC-002**: At least 95% of valid login attempts in a normal development or
  staging environment show either success navigation or actionable feedback
  within 3 seconds.
- **SC-003**: Users cannot authenticate by entering removed demo credentials
  unless those accounts also exist in the real API-backed environment.
- **SC-004**: All tested API rejection paths display user-safe feedback without
  exposing sensitive implementation details.
- **SC-005**: Refreshing a protected page after login preserves authenticated
  access when the API-backed session is valid and redirects or blocks access
  when it is invalid.

## Assumptions

- The public Swagger API already exposes the required authentication
  capabilities for login, student registration, current user lookup, token
  refresh, and logout.
- This feature replaces mock data for the web auth screens only; unrelated mock
  data in non-auth web features remains out of scope.
- Existing backend API contracts are intended to remain stable; backend endpoint
  changes are only required if integration reveals a missing or incompatible
  auth capability.
- The Swagger login and refresh responses provide access and refresh tokens but
  no explicit expiry timestamp, so expiry handling must be derived from token
  validity and auth endpoint responses. The client MUST treat failed `/auth/me`
  validation and failed `/auth/refresh` as the authoritative invalid-session
  signals; decoding JWT expiry is out of scope unless implementation adds and
  tests that behavior explicitly.
