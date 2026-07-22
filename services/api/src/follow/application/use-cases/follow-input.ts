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
} from '@/shared/validation/request-input';

export const FOLLOW_OBJECT_TYPES = [
  'AUTHOR',
  'JOURNAL',
  'KEYWORD',
  'TOPIC',
] as const;
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

export function parseFollowObjectId(value: unknown): string {
  if (typeof value !== 'string') {
    throw invalidInput('objectId is required');
  }

  const objectId = value.trim();
  if (!objectId) {
    throw invalidInput('objectId is required');
  }

  if (objectId.length > 128) {
    throw invalidInput('objectId must not exceed 128 characters');
  }

  return objectId;
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

function invalidInput(message: string): FollowUseCaseError {
  return new FollowUseCaseError(FollowFailureReason.InvalidInput, message);
}
