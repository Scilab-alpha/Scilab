import { UserManagementRepository } from '@/users/application/ports/user.ports';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';

export class DeleteUserUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User was not found',
      );
    }

    await this.users.delete(id);
  }
}
