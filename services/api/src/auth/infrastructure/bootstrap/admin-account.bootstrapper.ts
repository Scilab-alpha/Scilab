import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AuthProvider, RoleAccount, StatusAccount } from '@prisma/client';
import { Argon2PasswordHasher } from '@/auth/infrastructure/crypto/argon2-password-hasher';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AdminAccountBootstrapper implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminAccountBootstrapper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: Argon2PasswordHasher,
  ) {}

  async onApplicationBootstrap() {
    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!email && !password) {
      this.logger.warn(
        'ADMIN_EMAIL and ADMIN_PASSWORD are not set; default admin account was not created.',
      );
      return;
    }

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set together.');
    }

    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
    }

    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
    const passwordHash = await this.passwordHasher.hash(password);

    if (existingAdmin) {
      await this.prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email,
          password: passwordHash,
          type: AuthProvider.EMAIL,
          status: StatusAccount.ACTIVE,
          role: RoleAccount.ADMIN,
          firstName: existingAdmin.firstName ?? 'System',
          lastName: existingAdmin.lastName ?? 'Admin',
        },
      });
      this.logger.log(`Admin account ensured for ${email}.`);
      return;
    }

    await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.ADMIN,
        firstName: 'System',
        lastName: 'Admin',
      },
    });

    this.logger.log(`Admin account created for ${email}.`);
  }
}
