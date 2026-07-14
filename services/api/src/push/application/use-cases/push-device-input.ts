import { PushPlatform } from '@/push/application/ports/push.ports';
import { PushFailureReason, PushUseCaseError } from '@/push/domain/push.errors';
import { parseOptionalEnum } from '@/shared/validation/request-input';

const PUSH_PLATFORMS = ['IOS', 'ANDROID', 'WEB', 'UNKNOWN'] as const;
const TOKEN_MAX_LENGTH = 2048;
const CLIENT_DEVICE_ID_MAX_LENGTH = 255;

export function parsePushToken(value: unknown): string {
  if (typeof value !== 'string') {
    throw invalidInput('token is invalid');
  }

  const token = value.trim();
  if (token.length === 0 || token.length > TOKEN_MAX_LENGTH) {
    throw invalidInput('token is invalid');
  }

  return token;
}

export function parsePushPlatform(value: unknown): PushPlatform {
  try {
    return parseOptionalEnum(value, PUSH_PLATFORMS, 'platform') ?? 'UNKNOWN';
  } catch {
    throw invalidInput('platform is invalid');
  }
}

export function parseClientDeviceId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw invalidInput('clientDeviceId is invalid');
  }

  const clientDeviceId = value.trim();
  if (
    clientDeviceId.length === 0 ||
    clientDeviceId.length > CLIENT_DEVICE_ID_MAX_LENGTH
  ) {
    throw invalidInput('clientDeviceId is invalid');
  }

  return clientDeviceId;
}

function invalidInput(message: string): PushUseCaseError {
  return new PushUseCaseError(PushFailureReason.InvalidInput, message);
}
