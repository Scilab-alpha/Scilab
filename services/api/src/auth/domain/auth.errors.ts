export enum AuthFailureReason {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  AccountInactive = 'ACCOUNT_INACTIVE',
  TokenExpired = 'TOKEN_EXPIRED',
  TokenRevoked = 'TOKEN_REVOKED',
  TokenMalformed = 'TOKEN_MALFORMED',
  RefreshReused = 'REFRESH_REUSED',
  UserMissing = 'USER_MISSING',
  EmailAlreadyRegistered = 'EMAIL_ALREADY_REGISTERED',
  InvalidRegistrationInput = 'INVALID_REGISTRATION_INPUT',
}

export class AuthUseCaseError extends Error {
  constructor(
    public readonly reason: AuthFailureReason,
    message = 'Authentication failed',
  ) {
    super(message);
  }
}
