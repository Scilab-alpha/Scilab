# Feature Specification: Auth JWT Module

**Feature Branch**: `feat/auth-jwt`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Auth module for JWT authentication; add user registration with email, first name, last name, and password; registered users default to the Student role."

## Clarifications

### Session 2026-06-11

- Q: What token payload should auth responses return and what are the token TTLs? -> A: `data` contains only `accessToken` and `refreshToken`; access token TTL is 30 minutes and refresh token TTL is 30 days.

### Session 2026-06-14

- Requirement added: Users can register with `email`, `firstName`, `lastName`,
  and `password`; newly registered users receive the `Student` role by default.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register Student Account (Priority: P1)

A new user creates an account by providing an email address, first name, last
name, and password, then receives a registered account with the Student role.

**Why this priority**: New users need an account before they can sign in and use
authenticated features.

**Independent Test**: Can be tested by submitting valid registration details and
verifying that a user account is created with the submitted identity details and
the Student role.

**Acceptance Scenarios**:

1. **Given** a new user does not already have an account, **When** the user
   submits a valid email address, first name, last name, and password, **Then**
   the system creates an active account for that user.
2. **Given** a new account is created through registration, **When** the account
   is stored, **Then** the account role is Student by default.
3. **Given** a registration request is missing email address, first name, last
   name, or password, **When** the user submits the request, **Then** the system
   rejects the registration with a user-safe validation message.
4. **Given** the email address is already registered, **When** another user
   attempts to register with that email address, **Then** the system rejects the
   registration without creating a duplicate account.

---

### User Story 2 - Sign In With Credentials (Priority: P2)

A registered user signs in with valid credentials and receives an authenticated
session that can be used to access protected areas of the system.

**Why this priority**: Without a successful sign-in flow, no authenticated
workflow can be used or validated.

**Independent Test**: Can be tested by submitting valid credentials and
verifying that the response envelope contains `success`, `message`, and `data`,
where `data` contains only `accessToken` and `refreshToken`.

**Acceptance Scenarios**:

1. **Given** a registered active user, **When** the user submits valid
   credentials, **Then** the system grants an authenticated session and returns
   only `accessToken` and `refreshToken` in `data`.
2. **Given** a registered active user, **When** the user submits an incorrect
   password, **Then** the system denies access and returns a safe error message.

---

### User Story 3 - Refresh Authentication Tokens (Priority: P3)

An authenticated user refreshes credentials with a valid refresh token and
receives a new access token and refresh token pair.

**Why this priority**: Access tokens expire after 30 minutes, so users need a
secure way to continue an authenticated session without signing in again.

**Independent Test**: Can be tested by submitting a valid refresh token and
verifying that the response envelope `data` contains only `accessToken` and
`refreshToken`.

**Acceptance Scenarios**:

1. **Given** a user has a valid refresh token, **When** the user refreshes the
   session, **Then** the system returns a new access token and refresh token.
2. **Given** a refresh token is expired, revoked, malformed, or reused after
   rotation, **When** the user attempts to refresh, **Then** the system denies
   the request without exposing sensitive details.

---

### User Story 4 - Access Protected Features (Priority: P4)

An authenticated user accesses a protected feature by presenting a valid access
token issued by the system.

**Why this priority**: Protected features must be able to distinguish trusted
authenticated requests from anonymous or invalid ones.

**Independent Test**: Can be tested by attempting the same protected action with
a valid access token, no token, an expired token, and a malformed token.

**Acceptance Scenarios**:

1. **Given** a user has a valid access token, **When** the user requests a
   protected feature, **Then** the system allows the request and identifies the
   user.
2. **Given** a request has no access token, **When** it targets a protected
   feature, **Then** the system denies the request.
3. **Given** a request has an expired or invalid access token, **When** it
   targets a protected feature, **Then** the system denies the request without
   exposing sensitive details.

---

### User Story 5 - End Authenticated Session (Priority: P5)

An authenticated user signs out so that the current session can no longer be
used for protected access or token refresh.

**Why this priority**: Users need a reliable way to end access on shared,
borrowed, or compromised devices.

**Independent Test**: Can be tested by signing in, signing out, and verifying
that the previous access token and refresh token no longer grant access.

**Acceptance Scenarios**:

1. **Given** a user has an active authenticated session, **When** the user signs
   out, **Then** the system ends that session.
2. **Given** a user has signed out, **When** the previous access token is used
   for a protected feature, **Then** the system denies the request.
3. **Given** a user has signed out, **When** the previous refresh token is used
   to refresh the session, **Then** the system denies the request.

---

### Edge Cases

- A user attempts to register with an email address that is already in use.
- A user attempts to register with missing or invalid email, first name, last
  name, or password values.
- A newly registered account must receive the Student role even when no role is
  supplied by the user.
- A user attempts to sign in with a deactivated account.
- A user attempts repeated sign-ins with invalid credentials.
- An access token is expired, malformed, missing, or issued for a user that no
  longer exists.
- A refresh token is expired, malformed, revoked, or reused after a newer
  refresh token has been issued.
- A user signs out more than once with the same session.
- A protected request is made while account status changes from active to
  inactive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to register with email address, first
  name, last name, and password.
- **FR-002**: System MUST reject registration requests that are missing email
  address, first name, last name, or password.
- **FR-003**: System MUST reject registration when the submitted email address
  already belongs to an existing user account.
- **FR-004**: System MUST assign the Student role to every account created
  through registration by default.
- **FR-005**: System MUST store registered account credentials in a form that
  does not expose the raw password.
- **FR-006**: System MUST authenticate active registered users with valid
  credentials.
- **FR-007**: System MUST reject invalid credentials without revealing whether
  the account identifier or secret was incorrect.
- **FR-008**: System MUST issue an access token and refresh token after
  successful sign-in.
- **FR-009**: Sign-in and token refresh response `data` MUST contain only
  `accessToken` and `refreshToken`, with no user profile, token type, TTL, or
  additional metadata in `data`.
- **FR-010**: System MUST reject missing, malformed, expired, revoked, or
  otherwise invalid JWT-backed sessions.
- **FR-011**: System MUST allow protected features to require an authenticated
  user before access is granted.
- **FR-012**: System MUST allow users to end their current authenticated
  session.
- **FR-013**: System MUST prevent signed-out sessions from being reused for
  protected access or token refresh.
- **FR-014**: System MUST return user-safe authentication failure messages and
  avoid exposing secrets, token contents, or internal validation details.
- **FR-015**: System MUST record registration, authentication success, failure,
  refresh, and sign-out events for audit and support purposes without storing
  raw secrets.
- **FR-016**: Access tokens MUST expire 30 minutes after issue.
- **FR-017**: Refresh tokens MUST expire 30 days after issue.
- **FR-018**: System MUST allow a valid refresh token to issue a new access
  token and refresh token pair.

### Test Expectations *(mandatory)*

- **TE-001**: The first failing test for registration MUST prove that valid
  email address, first name, last name, and password create a Student account.
- **TE-002**: The first failing test for sign-in MUST prove that valid
  credentials establish an authenticated session.
- **TE-003**: Unit tests MUST cover registration decisions for valid
  registration details, duplicate email address, missing required fields, and
  default Student role assignment.
- **TE-004**: Unit tests MUST cover authentication decisions for active users,
  inactive users, invalid credentials, expired sessions, revoked sessions, and
  missing user identity.
- **TE-005**: Contract or integration tests MUST cover successful registration,
  duplicate registration rejection, successful sign-in, token refresh, protected
  access with a valid access token, protected access denial without a valid
  access token, and sign-out invalidation.
- **TE-006**: All API success and failure responses MUST use the standard
  envelope `{ "success": true, "message": "string", "data": {} }`, with
  `success` set to `false` for failures.
- **TE-007**: Contract tests MUST verify sign-in and refresh response `data`
  contain exactly `accessToken` and `refreshToken`.

### Key Entities *(include if feature involves data)*

- **User**: A person or account allowed to authenticate; includes identity,
  email address, first name, last name, default role, credentials status, and
  account status.
- **Authenticated Session**: A JWT-backed login state associated with a user,
  access-token issue time, refresh-token expiration, and revocation status.
- **Authentication Event**: A record of a sign-in, failed sign-in, token
  refresh, protected access denial, or sign-out event used for audit and
  support.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of new users can complete account registration in under 2
  minutes when they provide valid required details.
- **SC-002**: 100% of accounts created through registration receive the Student
  role by default.
- **SC-003**: 95% of users with valid credentials can complete sign-in in under
  10 seconds.
- **SC-004**: 100% of protected feature attempts without a valid authenticated
  session are denied.
- **SC-005**: 100% of signed-out sessions are denied when reused for protected
  access or token refresh.
- **SC-006**: Authentication failure responses do not reveal whether the
  account identifier or secret was incorrect in review testing.
- **SC-007**: Support and audit users can trace registration and authentication
  outcomes for a user without access to raw secrets.

## Assumptions

- New users can register directly before signing in.
- Accounts created through registration are active by default and receive the
  Student role.
- Credentials-based sign-in uses an account identifier and secret, such as
  email and password.
- Access-token TTL is 30 minutes and refresh-token TTL is 30 days.
- JWT-backed sessions can be invalidated at sign-out.
- Password reset, multi-factor authentication, social login, administrative
  role changes, and role-based authorization are outside the scope of this
  feature unless added by a later feature.
- Authentication event records retain only safe metadata and never store raw
  credentials or full secrets.
