import {
  PasswordHasher,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { BootstrapAdminInput } from '@/auth/application/use-cases/bootstrap-admin/bootstrap-admin.dto';

export class BootstrapAdminUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapAdminInput = {}) {
    const email = (input.email ?? process.env.ADMIN_EMAIL)
      ?.trim()
      .toLowerCase();
    const password = input.password ?? process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      return;
    }

    await this.users.ensureAdmin({
      email,
      passwordHash: await this.passwordHasher.hash(password),
    });
  }
}
