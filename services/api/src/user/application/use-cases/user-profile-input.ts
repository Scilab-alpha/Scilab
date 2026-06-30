import {
  UpdateUserProfileData,
  UserGender,
} from '@/user/application/ports/user.ports';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

const GENDERS = new Set<UserGender>(['MALE', 'FEMALE', 'OTHER']);

export interface UserProfilePatchInput {
  email?: unknown;
  firstname?: unknown;
  lastname?: unknown;
  gender?: unknown;
  dateofbirth?: unknown;
}

export function parseUserProfilePatch(
  input: UserProfilePatchInput,
): UpdateUserProfileData {
  const data: UpdateUserProfileData = {};

  if ('email' in input) {
    data.email = parseEmail(input.email);
  }

  if ('firstname' in input) {
    data.firstName = parseRequiredString(input.firstname, 'firstname');
  }

  if ('lastname' in input) {
    data.lastName = parseRequiredString(input.lastname, 'lastname');
  }

  if ('gender' in input) {
    data.gender = parseGender(input.gender);
  }

  if ('dateofbirth' in input) {
    data.dateOfBirth = parseDateOfBirth(input.dateofbirth);
  }

  if (Object.keys(data).length === 0) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      'At least one user field is required',
    );
  }

  return data;
}

function parseEmail(value: unknown): string {
  const email = parseRequiredString(value, 'email').toLowerCase();

  if (!email.includes('@') || email.length > 255) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      'User input is invalid',
    );
  }

  return email;
}

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      `${field} is invalid`,
    );
  }

  const parsed = value.trim();
  if (!parsed || parsed.length > 255) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      `${field} is invalid`,
    );
  }

  return parsed;
}

function parseGender(value: unknown): UserGender {
  const normalized = parseRequiredString(value, 'gender').toUpperCase() as
    | UserGender
    | undefined;

  if (!normalized || !GENDERS.has(normalized)) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      'gender is invalid',
    );
  }

  return normalized;
}

function parseDateOfBirth(value: unknown): Date {
  const date = parseRequiredString(value, 'dateofbirth');
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    throw new UserUseCaseError(
      UserFailureReason.InvalidInput,
      'dateofbirth is invalid',
    );
  }

  return parsed;
}
