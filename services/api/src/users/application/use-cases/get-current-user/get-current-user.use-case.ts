import {
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';
import { GetCurrentUserInput } from './get-current-user.dto';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  async execute(input: GetCurrentUserInput): Promise<UserRecord> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User was not found',
      );
    }

    return user;
  }
}
