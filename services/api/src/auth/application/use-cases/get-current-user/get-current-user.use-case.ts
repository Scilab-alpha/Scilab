import { UserRepository } from '@/auth/application/ports/auth.ports';
import {
  GetCurrentUserInput,
  GetCurrentUserOutput,
} from '@/auth/application/use-cases/get-current-user/get-current-user.dto';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const { currentUser } = input;
    const user = await this.users.findById(currentUser.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AuthUseCaseError(AuthFailureReason.UserMissing);
    }

    return {
      userId: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    };
  }
}
