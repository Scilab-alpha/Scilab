import { UserRepository } from '@/user/application/ports/user.ports';
import { UpdateCurrentUserInput } from '@/user/application/use-cases/update-current-user/update-current-user.dto';
import { parseUserProfilePatch } from '@/user/application/use-cases/user-profile-input';
import {
  toUserProfileOutput,
  UserProfileOutput,
} from '@/user/application/use-cases/user-profile.mapper';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

export class UpdateCurrentUserProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateCurrentUserInput): Promise<UserProfileOutput> {
    const data = parseUserProfilePatch(input.data);

    if (data.email) {
      const existingUser = await this.users.findByEmail(data.email);
      if (existingUser && existingUser.id !== input.userId) {
        throw new UserUseCaseError(
          UserFailureReason.EmailAlreadyUsed,
          'Email is already used',
        );
      }
    }

    const user = await this.users.updateProfile(input.userId, data);
    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User not found',
      );
    }

    return toUserProfileOutput(user);
  }
}
