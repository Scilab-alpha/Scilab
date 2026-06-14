# Data Model: Auth JWT Module

## Entity: User

Existing Prisma model: `User`

**Purpose**: Represents a registered account that can authenticate.

**Fields used by this feature**:

- `id`: Unique user identifier.
- `email`: Unique sign-in identifier.
- `password`: Stored password hash.
- `status`: Account status. Only `ACTIVE` users can authenticate.
- `role`: Account role included in token claims when needed by protected
  features.
- `firstName`, `lastName`, `imageUrl`: Optional profile fields available to
  non-token profile endpoints.

**Validation rules**:

- Email lookup must be case-insensitive from the user's perspective.
- Password must be verified through a password hashing adapter; raw submitted
  secrets must not be persisted or logged.
- Users with `INACTIVE` or `BANNED` status must not receive new sessions.

**Relationships**:

- One user can have many authenticated sessions.

## Entity: Authenticated Session

Planned Prisma model: `AuthSession`

**Purpose**: Tracks each JWT-backed login session so sign-out can revoke the
current access token and refresh token before natural expiration.

**Fields**:

- `id`: Unique session identifier.
- `userId`: User that owns the session.
- `accessTokenIdHash`: Hash of the access-token JWT `jti`; raw tokens and raw
  `jti` values are not stored.
- `refreshTokenHash`: Hash of the refresh token; raw refresh tokens are not
  stored.
- `issuedAt`: Time the session was created.
- `accessTokenExpiresAt`: Time after which the current access token is no
  longer accepted; exactly 30 minutes after issue.
- `refreshTokenExpiresAt`: Time after which the refresh token is no longer
  accepted; exactly 30 days after issue.
- `revokedAt`: Time the session was revoked by sign-out or administrative
  invalidation. Null means not revoked.
- `createdAt`: Persistence timestamp.
- `lastUsedAt`: Optional timestamp for last successful protected access.
- `rotatedAt`: Optional timestamp for the most recent refresh-token rotation.

**Validation rules**:

- `accessTokenIdHash` must be unique.
- `refreshTokenHash` must be unique.
- `accessTokenExpiresAt` must be exactly 30 minutes after `issuedAt`.
- `refreshTokenExpiresAt` must be exactly 30 days after `issuedAt` or the latest
  refresh rotation, according to the chosen rotation implementation.
- An access token is valid only when `revokedAt` is null and
  `accessTokenExpiresAt` is in the future.
- A refresh token is valid only when `revokedAt` is null and
  `refreshTokenExpiresAt` is in the future.
- A session must be denied if the related user no longer exists or is not
  `ACTIVE`.

**State transitions**:

```text
Issued -> Active -> Refreshed
Issued -> Active -> Revoked
Issued -> Active -> Expired
```

- `Issued`: Session record created and access/refresh tokens returned.
- `Active`: Access token accepted for protected access.
- `Refreshed`: Refresh token accepted and a new access/refresh token pair
  returned.
- `Revoked`: User signs out or session is invalidated.
- `Expired`: Current time is later than the relevant token expiration; no
  mutation is required.

## Entity: Authentication Event

Planned representation: audit log record or structured application log event.

**Purpose**: Supports audit and support use cases without recording secrets.

**Fields**:

- `id`: Unique event identifier if persisted.
- `userId`: User involved when known.
- `email`: Submitted account identifier for failed attempts when user is unknown,
  normalized and safe for audit policy.
- `eventType`: `SIGN_IN_SUCCESS`, `SIGN_IN_FAILURE`, `TOKEN_REFRESH_SUCCESS`,
  `TOKEN_REFRESH_FAILURE`, `TOKEN_DENIED`, `SIGN_OUT`.
- `reason`: Safe reason category such as `INVALID_CREDENTIALS`,
  `ACCOUNT_INACTIVE`, `TOKEN_EXPIRED`, `TOKEN_REVOKED`, `TOKEN_MALFORMED`, or
  `REFRESH_REUSED`.
- `occurredAt`: Event time.
- `requestContext`: Safe request metadata such as IP hash or user agent when
  available and allowed.

**Validation rules**:

- Raw passwords, raw JWTs, and raw secret material must never be stored.
- Failure messages returned to users must remain generic even when audit reasons
  are specific.

## Access Token Claims

**Purpose**: Carries minimal identity and session linkage for bearer
authentication. Access tokens expire 30 minutes after issue.

**Claims**:

- `sub`: User id.
- `jti`: Unique token/session identifier.
- `iat`: Issued-at timestamp.
- `exp`: Expiration timestamp.
- `role`: User role, if needed by downstream consumers.

**Validation rules**:

- `sub`, `jti`, and `exp` are required.
- Token signature and expiration must be valid before session lookup.
- Claims must not include password hashes or sensitive profile data.

## Refresh Token

**Purpose**: Allows the client to obtain a new access token and refresh token
pair without re-entering credentials. Refresh tokens expire 30 days after issue.

**Validation rules**:

- Refresh token values must be opaque to clients.
- Raw refresh token values must never be stored.
- A valid refresh token response `data` must contain exactly `accessToken` and
  `refreshToken`.
- Reused, revoked, expired, or malformed refresh tokens must be denied.
