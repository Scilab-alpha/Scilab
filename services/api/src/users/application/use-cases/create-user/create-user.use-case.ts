import { PasswordHasher } from '@/auth/application/ports/auth.ports';
import {
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';
import { CreateUserInput } from './create-user.dto';
import {
  assertValid,
  AUTH_PROVIDER_VALUES,
  GENDER_VALUES,
  normalizeEmail,
  normalizeOptionalEnum,
  normalizeOptionalText,
  normalizeRequiredEnum,
  parseOptionalDate,
  ROLE_VALUES,
  STATUS_VALUES,
} from '../user-input';

export class CreateUserUseCase {
  constructor(
    private readonly users: UserManagementRepository,
    private readonly passwordHasher: Pick<PasswordHasher, 'hash'>,
  ) {}

  async execute(input: CreateUserInput): Promise<UserRecord> {
    const email = normalizeEmail(input.email);
    const type = normalizeRequiredEnum(input.type, AUTH_PROVIDER_VALUES);
    const status = normalizeRequiredEnum(input.status, STATUS_VALUES);
    const role = normalizeRequiredEnum(input.role, ROLE_VALUES);
    const dateOfBirth = parseOptionalDate(input.dateOfBirth);
    const gender = normalizeOptionalEnum(input.gender, GENDER_VALUES);

    assertValid(
      email &&
        input.password &&
        input.password.length >= 8 &&
        type &&
        status &&
        role &&
        dateOfBirth !== null &&
        gender !== null,
    );

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new UserUseCaseError(
        UserFailureReason.EmailAlreadyExists,
        'Email is already registered',
      );
    }

    const password = await this.passwordHasher.hash(input.password);
    return this.users.create({
      email,
      password,
      type,
      status,
      role,
      firstName: normalizeOptionalText(input.firstName),
      lastName: normalizeOptionalText(input.lastName),
      imageUrl: normalizeOptionalText(input.imageUrl),
      dateOfBirth,
      gender,
    });
  }
}
