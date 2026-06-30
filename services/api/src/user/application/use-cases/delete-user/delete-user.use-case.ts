import { UserRepository } from '@/user/application/ports/user.ports';
import { DeleteUserInput } from '@/user/application/use-cases/delete-user/delete-user.dto';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';

export class DeleteUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: DeleteUserInput): Promise<void> {
    const deleted = await this.users.deleteById(input.userId);

    if (!deleted) {
      throw new UserUseCaseError(
        UserFailureReason.UserMissing,
        'User not found',
      );
    }
  }
}
