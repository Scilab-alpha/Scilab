import {
  UserRepository,
  UserStatus,
} from '@/user/application/ports/user.ports';
import { UpdateUserStatusInput } from '@/user/application/use-cases/update-user-status/update-user-status.dto';
import {
  toUserProfileOutput,
  UserProfileOutput,
} from '@/user/application/use-cases/user-profile.mapper';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

const STATUSES = new Set<UserStatus>(['ACTIVE', 'INACTIVE', 'BANNED']);

export class UpdateUserStatusUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateUserStatusInput): Promise<UserProfileOutput> {
    const status = this.parseStatus(input.status);
    const user = await this.users.updateStatus(input.userId, status);

    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User not found',
      );
    }

    return toUserProfileOutput(user);
  }

  private parseStatus(value: unknown): UserStatus {
    if (typeof value !== 'string') {
      throw new UserUseCaseError(
        UserFailureReason.InvalidInput,
        'status is invalid',
      );
    }

    const status = value.trim().toUpperCase() as UserStatus;
    if (!STATUSES.has(status)) {
      throw new UserUseCaseError(
        UserFailureReason.InvalidInput,
        'status is invalid',
      );
    }

    return status;
  }
}
