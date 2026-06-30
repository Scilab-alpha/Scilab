import { UserRepository } from '@/user/application/ports/user.ports';
import { ListUsersOutput } from '@/user/application/use-cases/list-users/list-users.dto';
import { toUserProfileOutput } from '@/user/application/use-cases/user-profile.mapper';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<ListUsersOutput> {
    const users = await this.users.list();
    return {
      users: users.map(toUserProfileOutput),
    };
  }
}
