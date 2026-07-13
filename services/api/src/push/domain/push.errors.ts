export enum PushFailureReason {
  InvalidInput = 'INVALID_INPUT',
}

export class PushUseCaseError extends Error {
  constructor(
    readonly reason: PushFailureReason,
    message = 'Push request failed',
  ) {
    super(message);
  }
}
