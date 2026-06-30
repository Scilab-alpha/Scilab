export enum AuthFailureReason {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  AccountInactive = 'ACCOUNT_INACTIVE',
  TokenExpired = 'TOKEN_EXPIRED',
  TokenRevoked = 'TOKEN_REVOKED',
  TokenMalformed = 'TOKEN_MALFORMED',
  RefreshReused = 'REFRESH_REUSED',
  UserMissing = 'USER_MISSING',
  InvalidRegistration = 'INVALID_REGISTRATION',
  EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
  ReservedAdminEmail = 'RESERVED_ADMIN_EMAIL',
}

export class AuthUseCaseError extends Error {
  constructor(
    public readonly reason: AuthFailureReason,
    message = 'Authentication failed',
  ) {
    super(message);
  }
}
