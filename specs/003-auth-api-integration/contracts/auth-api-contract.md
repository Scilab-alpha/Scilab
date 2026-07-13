# Contract: Web Auth API Integration

This contract documents the API surface the web auth screens consume. It is a
consumer-facing contract based on the public Swagger document at
`https://scilab-api.epsilon.io.vn/api/docs#/`, checked on 2026-07-11. If
implementation changes backend endpoints or payloads, update the backend
OpenAPI/Swagger contract in the same change.

## Standard Envelope

Successful and failed responses use the repository standard envelope:

```json
{
  "success": true,
  "message": "Human-readable status",
  "data": {}
}
```

The typed web API layer must unwrap `data` and preserve `message` when useful
for UI feedback.

## POST /auth/login

Signs in with email and password.

**Request Body**:

```json
{
  "email": "user@example.edu",
  "password": "user-password"
}
```

**Success**: `200 OK`

```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "jwt",
    "refreshToken": "refresh-token"
  }
}
```

**Failure Mapping**:

- `400`: Email or password missing. Show field or form error.
- `401`: Authentication failed. Show safe invalid login feedback.
- `403`: Account is not allowed to sign in. Show safe account status feedback.

## POST /auth/register

Registers a student account.

**Request Body**:

```json
{
  "email": "user@example.edu",
  "password": "strong-password",
  "firstname": "Jane",
  "lastname": "Smith",
  "gender": "OTHER",
  "dataofbirth": "2001-04-12"
}
```

**Success**: `201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "user-id",
    "email": "user@example.edu",
    "status": "ACTIVE",
    "role": "STUDENT",
    "firstName": "Jane",
    "lastName": "Smith",
    "gender": "OTHER",
    "dateOfBirth": "2001-04-12T00:00:00.000Z"
  }
}
```

**Failure Mapping**:

- `400`: Registration input is invalid. Map to field errors when possible.
- `409`: Email is already registered. Map to email field and summary message.

**Implementation Note**:

Registration returns the created user, not auth tokens. If the product flow
should land the user in an authenticated session, call `/auth/login` with the
submitted credentials after successful registration, then call `/auth/me` to
normalize the session user.

## POST /auth/refresh

Refreshes access and refresh tokens.

**Request Body**:

```json
{
  "refreshToken": "refresh-token"
}
```

**Success**: `200 OK`

```json
{
  "success": true,
  "message": "Authentication refreshed",
  "data": {
    "accessToken": "jwt",
    "refreshToken": "refresh-token"
  }
}
```

**Failure Mapping**:

- `400`: Refresh token is required. Clear session and require login.
- `401`: Authentication failed. Clear session and require login.

## GET /auth/me

Returns the authenticated user for session normalization.

**Authentication**: Bearer access token.

**Success**: `200 OK`

```json
{
  "success": true,
  "message": "Current user retrieved",
  "data": {
    "id": "user-id",
    "email": "user@example.edu",
    "status": "ACTIVE",
    "role": "STUDENT",
    "firstName": "Jane",
    "lastName": "Smith",
    "imageUrl": null
  }
}
```

**Failure Mapping**:

- `401`: Authentication failed. Attempt refresh when a refresh token exists;
  otherwise clear session and require login.

## POST /auth/logout

Revokes the current authenticated session.

**Authentication**: Bearer access token.

**Request Body**: none.

**Success**: `200 OK`

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

**Failure Mapping**:

- `401`: Authentication failed. Clear local auth state and continue to login.
- Network failure: Show retryable message, but allow local cleanup if the user
  explicitly chooses to leave the session.

## GET /users/me

Returns the authenticated user's full profile. Auth flows should prefer
`/auth/me` for session normalization and use this endpoint only when account or
profile screens require extra fields such as gender or date of birth.

**Authentication**: Bearer access token.

**Success**: `200 OK`

```json
{
  "success": true,
  "message": "Current user retrieved",
  "data": {
    "id": "user-id",
    "email": "user@example.edu",
    "status": "ACTIVE",
    "role": "STUDENT",
    "firstName": "Jane",
    "lastName": "Smith",
    "imageUrl": null,
    "gender": "OTHER",
    "dateOfBirth": "2001-04-12T00:00:00.000Z"
  }
}
```

**Failure Mapping**:

- `401`: Authentication failed. Attempt refresh when a refresh token exists;
  otherwise clear session and require login.
- `404`: User not found. Clear session and require login.

## Google OAuth

No Google OAuth endpoint is visible in the public Swagger auth surface. The web
app must not use demo credentials for Google sign-in or registration. If an
existing OAuth endpoint is added to Swagger later, add its request/response
details here and wire the UI to that contract. If a backend endpoint must be
added, update OpenAPI/Swagger and backend tests in the same change.
