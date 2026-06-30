import { UserRepository } from '@/user/application/ports/user.ports';
import {
  toUserProfileOutput,
  UserProfileOutput,
} from '@/user/application/use-cases/user-profile.mapper';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

export class GetCurrentUserProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { userId: string }): Promise<UserProfileOutput> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User not found',
      );
    }

    return toUserProfileOutput(user);
  }
}
