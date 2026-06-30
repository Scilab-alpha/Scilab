import {
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';

export class GetUserUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  async execute(id: string): Promise<UserRecord> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User was not found',
      );
    }

    return user;
  }
}
