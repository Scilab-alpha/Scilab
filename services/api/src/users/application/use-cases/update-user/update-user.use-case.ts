import {
  UpdateUserData,
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';
import { UpdateUserInput } from './update-user.dto';
import {
  assertValid,
  GENDER_VALUES,
  normalizeEmail,
  normalizeOptionalEnum,
  normalizeOptionalText,
  parseOptionalDate,
} from '../user-input';

export class UpdateUserUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const existingUser = await this.users.findById(id);
    if (!existingUser) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User was not found',
      );
    }

    const data: UpdateUserData = {};

    if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      assertValid(email);

      if (email !== existingUser.email.toLowerCase()) {
        const duplicate = await this.users.findByEmail(email);
        if (duplicate && duplicate.id !== id) {
          throw new UserUseCaseError(
            UserFailureReason.EmailAlreadyExists,
            'Email is already registered',
          );
        }
      }

      data.email = email;
    }

    if (input.firstName !== undefined) {
      data.firstName = normalizeOptionalText(input.firstName);
    }

    if (input.lastName !== undefined) {
      data.lastName = normalizeOptionalText(input.lastName);
    }

    if (input.imageUrl !== undefined) {
      data.imageUrl = normalizeOptionalText(input.imageUrl);
    }

    if (input.dateOfBirth !== undefined) {
      const dateOfBirth = parseOptionalDate(input.dateOfBirth);
      assertValid(dateOfBirth !== null);
      data.dateOfBirth = dateOfBirth;
    }

    if (input.gender !== undefined) {
      const gender = normalizeOptionalEnum(input.gender, GENDER_VALUES);
      assertValid(gender !== null);
      data.gender = gender;
    }

    assertValid(Object.keys(data).length > 0);
    return this.users.update(id, data);
  }
}
