import {
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';

export class ListUsersUseCase {
  constructor(private readonly users: UserManagementRepository) {}

  execute(): Promise<UserRecord[]> {
    return this.users.findMany();
  }
}
