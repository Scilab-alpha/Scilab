import {
  AuthenticatedUser,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(
    currentUser: AuthenticatedUser,
  ): Promise<Omit<AuthenticatedUser, 'sessionId'>> {
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
