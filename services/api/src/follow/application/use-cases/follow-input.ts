import {
  FollowNotifyMode,
  FollowObjectType,
} from '@/follow/application/ports/follow.ports';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';
import {
  parseEnum,
  parseOptionalEnum,
  parseUuid,
} from '@/shared/validation/request-input';

export const FOLLOW_OBJECT_TYPES = ['JOURNAL', 'KEYWORD', 'TOPIC'] as const;
export const FOLLOW_NOTIFY_MODES = [
  'IN_APP',
  'DAILY_EMAIL',
  'WEEKLY_EMAIL',
  'OFF',
] as const;

export function parseFollowObjectType(value: unknown): FollowObjectType {
  try {
    return parseEnum(value, FOLLOW_OBJECT_TYPES, 'objectType');
  } catch {
    throw invalidInput('objectType is invalid');
  }
}

export function parseOptionalFollowObjectType(
  value: unknown,
): FollowObjectType | undefined {
  try {
    return parseOptionalEnum(value, FOLLOW_OBJECT_TYPES, 'type');
  } catch {
    throw invalidInput('type is invalid');
  }
}

export function parseFollowNotifyMode(value: unknown): FollowNotifyMode {
  try {
    return parseEnum(value, FOLLOW_NOTIFY_MODES, 'notifyMode');
  } catch {
    throw invalidInput('notifyMode is invalid');
  }
}

export function parseOptionalFollowNotifyMode(
  value: unknown,
): FollowNotifyMode {
  if (value === undefined || value === null || value === '') {
    return 'IN_APP';
  }

  return parseFollowNotifyMode(value);
}

export function parseFollowObjectId(value: unknown): string {
  try {
    return parseUuid(value, 'objectId');
  } catch {
    throw invalidInput('objectId is invalid');
  }
}

function invalidInput(message: string): FollowUseCaseError {
  return new FollowUseCaseError(FollowFailureReason.InvalidInput, message);
}
