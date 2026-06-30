import { UserRepository, UserRole } from '@/user/application/ports/user.ports';
import { UpdateUserRoleInput } from '@/user/application/use-cases/update-user-role/update-user-role.dto';
import {
  toUserProfileOutput,
  UserProfileOutput,
} from '@/user/application/use-cases/user-profile.mapper';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

const PATCHABLE_ROLES = new Set<UserRole>(['STUDENT', 'RESEARCHER']);

export class UpdateUserRoleUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<UserProfileOutput> {
    const role = this.parseRole(input.role);
    const user = await this.users.updateRole(input.userId, role);

    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User not found',
      );
    }

    return toUserProfileOutput(user);
  }

  private parseRole(value: unknown): UserRole {
    if (typeof value !== 'string') {
      throw new UserUseCaseError(
        UserFailureReason.InvalidInput,
        'role is invalid',
      );
    }

    const role = value.trim().toUpperCase() as UserRole;
    if (!PATCHABLE_ROLES.has(role)) {
      throw new UserUseCaseError(
        UserFailureReason.InvalidInput,
        'role is invalid',
      );
    }

    return role;
  }
}
