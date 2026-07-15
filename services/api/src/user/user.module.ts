import { Module } from '@nestjs/common';
import { DeleteUserUseCase } from '@/user/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserProfileUseCase } from '@/user/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserByIdUseCase } from '@/user/application/use-cases/get-user-by-id/get-user-by-id.use-case';
import { ListUsersUseCase } from '@/user/application/use-cases/list-users/list-users.use-case';
import { UpdateCurrentUserProfileUseCase } from '@/user/application/use-cases/update-current-user/update-current-user.use-case';
import { UpdateUserUseCase } from '@/user/application/use-cases/update-user/update-user.use-case';
import { UpdateUserRoleUseCase } from '@/user/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '@/user/application/use-cases/update-user-status/update-user-status.use-case';
import { PrismaUserManagementRepository } from '@/user/infrastructure/persistence/prisma-user-management.repository';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';
import { UserController } from '@/user/interfaces/http/user.controller';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@repo/database';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserController],
  providers: [
    PrismaUserManagementRepository,
    AdminGuard,
    {
      provide: GetCurrentUserProfileUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new GetCurrentUserProfileUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateCurrentUserProfileUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateCurrentUserProfileUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new ListUsersUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: GetUserByIdUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new GetUserByIdUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateUserRoleUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateUserRoleUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: UpdateUserStatusUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new UpdateUserStatusUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (users: PrismaUserManagementRepository) =>
        new DeleteUserUseCase(users),
      inject: [PrismaUserManagementRepository],
    },
  ],
})
export class UserModule {}
