import { UserRepository } from '@/user/application/ports/user.ports';
import { GetUserByIdInput } from '@/user/application/use-cases/get-user-by-id/get-user-by-id.dto';
import {
  toUserProfileOutput,
  UserProfileOutput,
} from '@/user/application/use-cases/user-profile.mapper';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

export class GetUserByIdUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetUserByIdInput): Promise<UserProfileOutput> {
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
