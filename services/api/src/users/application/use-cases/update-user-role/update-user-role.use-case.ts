import {
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';
import { UpdateUserRoleInput } from './update-user-role.dto';
import { assertValid, normalizeRequiredEnum } from '../user-input';

const ROLE_UPDATE_VALUES = ['STUDENT', 'RESEARCHER'] as const;

export class UpdateUserRoleUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  async execute(id: string, input: UpdateUserRoleInput): Promise<UserRecord> {
    const existingUser = await this.users.findById(id);
    if (!existingUser) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User was not found',
      );
    }

    const role = normalizeRequiredEnum(input.role, ROLE_UPDATE_VALUES);
    assertValid(role);

    return this.users.update(id, { role });
  }
}
