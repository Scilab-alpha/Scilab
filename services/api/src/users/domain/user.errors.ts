export enum UserFailureReason {
  UserMissing = 'USER_MISSING',
  EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
  InvalidUserInput = 'INVALID_USER_INPUT',
}

export class UserUseCaseError extends Error {
  constructor(
    readonly reason: UserFailureReason,
    message: string = reason,
  ) {
    super(message);
  }
}
