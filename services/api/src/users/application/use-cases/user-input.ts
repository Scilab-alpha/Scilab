import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const AUTH_PROVIDER_VALUES = ['EMAIL', 'GOOGLE'] as const;
export const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'BANNED'] as const;
export const ROLE_VALUES = ['STUDENT', 'RESEARCHER', 'ADMIN'] as const;
export const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const;

export function normalizeEmail(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

export function normalizeOptionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const text = value.trim();
  return text || null;
}

export function normalizeRequiredEnum(
  value: string | undefined,
  allowed: readonly string[],
): string | null {
  const candidate = value?.trim().toUpperCase();
  return candidate && allowed.includes(candidate) ? candidate : null;
}

export function normalizeOptionalEnum(
  value: string | null | undefined,
  allowed: readonly string[],
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return normalizeRequiredEnum(value, allowed);
}

export function parseOptionalDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function assertValid(condition: unknown): asserts condition {
  if (!condition) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidUserInput,
      'User input is invalid',
    );
  }
}
