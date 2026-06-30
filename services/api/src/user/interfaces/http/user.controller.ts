import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { DeleteUserUseCase } from '@/user/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserProfileUseCase } from '@/user/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserByIdUseCase } from '@/user/application/use-cases/get-user-by-id/get-user-by-id.use-case';
import { ListUsersUseCase } from '@/user/application/use-cases/list-users/list-users.use-case';
import { UpdateCurrentUserProfileUseCase } from '@/user/application/use-cases/update-current-user/update-current-user.use-case';
import { UpdateUserUseCase } from '@/user/application/use-cases/update-user/update-user.use-case';
import { UpdateUserRoleUseCase } from '@/user/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '@/user/application/use-cases/update-user-status/update-user-status.use-case';
import { UserFailureReason, UserUseCaseError } from '@/user/domain/user.errors';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';
import {
  PatchUserDataDto,
  PatchUserRoleDto,
  PatchUserStatusDto,
} from '@/user/interfaces/http/user.dto';
import {
  ApiDeleteUser,
  ApiGetMyUser,
  ApiGetUser,
  ApiListUsers,
  ApiPatchMyUser,
  ApiPatchUser,
  ApiPatchUserRole,
  ApiPatchUserStatus,
} from '@/user/interfaces/http/user.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserProfileUseCase,
    private readonly updateCurrentUser: UpdateCurrentUserProfileUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUserById: GetUserByIdUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updateUserRole: UpdateUserRoleUseCase,
    private readonly updateUserStatus: UpdateUserStatusUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiGetMyUser()
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    try {
      const user = await this.getCurrentUser.execute({
        userId: currentUser.userId,
      });
      return createSuccessResponse(user, 'User retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiPatchMyUser()
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: PatchUserDataDto,
  ) {
    try {
      const user = await this.updateCurrentUser.execute({
        userId: currentUser.userId,
        data: body,
      });
      return createSuccessResponse(user, 'User updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiListUsers()
  async findAll() {
    const users = await this.listUsers.execute();
    return createSuccessResponse(users, 'Users retrieved');
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiGetUser()
  async findOne(@Param('userId') userId: string) {
    try {
      const user = await this.getUserById.execute({ userId });
      return createSuccessResponse(user, 'User retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiPatchUser()
  async updateOne(
    @Param('userId') userId: string,
    @Body() body: PatchUserDataDto,
  ) {
    try {
      const user = await this.updateUser.execute({ userId, data: body });
      return createSuccessResponse(user, 'User updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':userId/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiPatchUserRole()
  async updateRole(
    @Param('userId') userId: string,
    @Body() body: PatchUserRoleDto,
  ) {
    try {
      const user = await this.updateUserRole.execute({
        userId,
        role: body.role,
      });
      return createSuccessResponse(user, 'User role updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':userId/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiPatchUserStatus()
  async updateStatus(
    @Param('userId') userId: string,
    @Body() body: PatchUserStatusDto,
  ) {
    try {
      const user = await this.updateUserStatus.execute({
        userId,
        status: body.status,
      });
      return createSuccessResponse(user, 'User status updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiDeleteUser()
  async remove(@Param('userId') userId: string) {
    try {
      await this.deleteUser.execute({ userId });
      return createSuccessResponse({}, 'User deleted');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown) {
    if (error instanceof UserUseCaseError) {
      if (error.reason === UserFailureReason.EmailAlreadyUsed) {
        return new ConflictException(error.message);
      }

      if (error.reason === UserFailureReason.InvalidInput) {
        return new BadRequestException(error.message);
      }

      if (error.reason === UserFailureReason.UserMissing) {
        return new NotFoundException(error.message);
      }
    }

    return new InternalServerErrorException('User request failed');
  }
}
