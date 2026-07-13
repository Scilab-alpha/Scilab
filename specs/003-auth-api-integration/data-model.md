# Data Model: Auth API Integration

## Auth Session

Represents the API-backed authenticated session available to the web app.

**Fields**:

- `accessToken`: Short-lived credential used for authenticated API requests.
- `refreshToken`: Refresh credential when returned or supported by the API.
- `expiresAt`: Optional derived expiry state only when the implementation has a
  tested source for it. The current Swagger login and refresh responses do not
  include an explicit expiry timestamp, so this field is not required.
- `status`: `anonymous`, `loading`, `authenticated`, `refreshing`, or
  `expired`.

**Validation Rules**:

- A session is authenticated only after an API success response.
- Expired, missing, malformed, or revoked credentials must not grant protected
  route access.
- Failed `/auth/me` validation followed by failed `/auth/refresh` is the
  authoritative expired or invalid-session signal. JWT expiry decoding is out
  of scope unless it is implemented and tested explicitly.
- Tokens must never be shown in UI messages or logs.

**State Transitions**:

- `anonymous` -> `loading` when login, register, or session restoration starts.
- `loading` -> `authenticated` after API-confirmed success.
- `authenticated` -> `refreshing` when refresh is attempted.
- `refreshing` -> `authenticated` after refresh success.
- `loading` or `refreshing` -> `expired` after invalid, revoked, or missing
  session response.
- Any state -> `anonymous` after logout cleanup.

## Authenticated User

Represents the current user returned by the API and consumed by the web shell,
route guards, and role-based UI.

**Fields**:

- `id`: Stable API user identifier.
- `email`: User email address.
- `status`: Account status returned by the API.
- `role`: Role used for post-auth navigation and permissions.
- `firstName`: User given name when available.
- `lastName`: User family name when available.
- `displayName`: UI-friendly display name derived from profile fields when
  needed.
- `imageUrl`: Optional profile image URL.
- `gender`: Optional full-profile field available from `/users/me`.
- `dateOfBirth`: Optional full-profile field available from `/users/me`.

**Validation Rules**:

- Role mapping must be explicit and typed.
- Missing optional profile fields must fall back to safe display values.
- Permission checks must use authenticated user role data, not demo role data.

## Auth Request

Represents a user-initiated authentication action.

**Variants**:

- `login`: Email and password.
- `register`: Email, password, first name, last name, gender, and date of birth
  fields required by the Swagger registration contract.
- `refresh`: Refresh credential.
- `currentUser`: Existing session credential.
- `logout`: Current session identity.
- `googleOAuth`: Real API OAuth flow only when a backend contract exists.

**Validation Rules**:

- Login and registration forms keep client validation with React Hook Form and
  Zod before submission.
- API validation remains authoritative and must be mapped back to form fields.
- Duplicate submissions must be blocked while a request is pending.

## Auth Error

Represents a user-safe error normalized from API, validation, network, timeout,
or unexpected failures.

**Fields**:

- `code`: Stable client-facing error category.
- `message`: Safe summary for the auth screen or toast.
- `fieldErrors`: Optional field-level messages keyed by form field.
- `retryable`: Whether the user can reasonably retry without changing input.

**Validation Rules**:

- Errors must not expose tokens, stack traces, internal exception names, or raw
  backend payloads.
- Unknown errors must use a safe fallback message.
- API field names must be mapped to current form labels and controls.

## Relationships

- An `Auth Request` may create, refresh, validate, or destroy an `Auth Session`.
- An authenticated `Auth Session` resolves to one `Authenticated User`.
- `Auth Error` can be produced by any request and displayed by auth screens.
- Route guards consume `Auth Session` and `Authenticated User` to decide access.
