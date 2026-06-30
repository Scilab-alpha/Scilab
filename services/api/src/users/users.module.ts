import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { Argon2PasswordHasher } from '@/auth/infrastructure/crypto/argon2-password-hasher';
import { PrismaModule } from '@/prisma/prisma.module';
import { CreateUserUseCase } from '@/users/application/use-cases/create-user/create-user.use-case';
import { DeleteUserUseCase } from '@/users/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserUseCase } from '@/users/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserUseCase } from '@/users/application/use-cases/get-user/get-user.use-case';
import { ListUsersUseCase } from '@/users/application/use-cases/list-users/list-users.use-case';
import { UpdateUserRoleUseCase } from '@/users/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserUseCase } from '@/users/application/use-cases/update-user/update-user.use-case';
import { PrismaUserManagementRepository } from '@/users/infrastructure/persistence/prisma-user-management.repository';
import { UserController } from '@/users/interfaces/http/user.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserController],
  providers: [
    PrismaUserManagementRepository,
    Argon2PasswordHasher,
    {
      provide: CreateUserUseCase,
      useFactory: (
        users: PrismaUserManagementRepository,
        passwordHasher: Argon2PasswordHasher,
      ) => new CreateUserUseCase(users, passwordHasher),
      inject: [PrismaUserManagementRepository, Argon2PasswordHasher],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new DeleteUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new GetCurrentUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: GetUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new GetUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new ListUsersUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateUserRoleUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateUserRoleUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
  ],
})
export class UsersModule {}
