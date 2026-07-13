export enum UserFailureReason {
  EmailAlreadyUsed = 'EMAIL_ALREADY_USED',
  InvalidInput = 'INVALID_INPUT',
  UserMissing = 'USER_MISSING',
}

export class UserUseCaseError extends Error {
  constructor(
    readonly reason: UserFailureReason,
    message = 'User request failed',
  ) {
    super(message);
  }
}
