export enum FollowFailureReason {
  InvalidInput = 'INVALID_INPUT',
  TargetMissing = 'TARGET_MISSING',
  FollowMissing = 'FOLLOW_MISSING',
}

export class FollowUseCaseError extends Error {
  constructor(
    readonly reason: FollowFailureReason,
    message = 'Follow request failed',
  ) {
    super(message);
  }
}
