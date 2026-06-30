import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import type { UserRecord } from '@/users/application/ports/user.ports';
import type { UpdateUserInput } from '@/users/application/use-cases/update-user/update-user.dto';
import { CreateUserUseCase } from '@/users/application/use-cases/create-user/create-user.use-case';
import { DeleteUserUseCase } from '@/users/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserUseCase } from '@/users/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserUseCase } from '@/users/application/use-cases/get-user/get-user.use-case';
import { ListUsersUseCase } from '@/users/application/use-cases/list-users/list-users.use-case';
import { UpdateUserRoleUseCase } from '@/users/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserUseCase } from '@/users/application/use-cases/update-user/update-user.use-case';
import {
  UserFailureReason,
  UserUseCaseError,
} from '@/users/domain/user.errors';
import {
  ApiCreateUser,
  ApiCurrentUser,
  ApiDeleteUser,
  ApiGetUser,
  ApiListUsers,
  ApiUpdateUserRole,
  ApiUpdateUser,
} from '@/users/interfaces/http/user.swagger';
import { CreateUserDto } from '@/users/interfaces/http/dto/create-user.dto';
import { UpdateUserRoleDto } from '@/users/interfaces/http/dto/update-user-role.dto';
import { UpdateUserDto } from '@/users/interfaces/http/dto/update-user.dto';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Get('me')
  @ApiCurrentUser()
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    try {
      const user = await this.getCurrentUserUseCase.execute(currentUser);
      return createSuccessResponse(
        this.presentUser(user),
        'Current user retrieved',
      );
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Get()
  @ApiListUsers()
  async list(@CurrentUser() currentUser: AuthenticatedUser) {
    this.assertAdmin(currentUser);

    const users = await this.listUsersUseCase.execute();
    return createSuccessResponse(
      { users: users.map((user) => this.presentUser(user)) },
      'Users retrieved',
    );
  }

  @Get(':id')
  @ApiGetUser()
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAdmin(currentUser);

    try {
      const user = await this.getUserUseCase.execute(id);
      return createSuccessResponse(this.presentUser(user), 'User retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post()
  @HttpCode(201)
  @ApiCreateUser()
  async create(
    @Body() body: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAdmin(currentUser);

    try {
      const user = await this.createUserUseCase.execute(body);
      return createSuccessResponse(this.presentUser(user), 'User created');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':id')
  @ApiUpdateUser()
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAdmin(currentUser);

    try {
      const user = await this.updateUserUseCase.execute(
        id,
        this.toUpdateInput(body),
      );
      return createSuccessResponse(this.presentUser(user), 'User updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':id/role')
  @ApiUpdateUserRole()
  async updateRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAdmin(currentUser);

    try {
      const user = await this.updateUserRoleUseCase.execute(id, body);
      return createSuccessResponse(this.presentUser(user), 'User role updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiDeleteUser()
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAdmin(currentUser);

    try {
      await this.deleteUserUseCase.execute(id);
      return createSuccessResponse({}, 'User deleted');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private assertAdmin(currentUser: AuthenticatedUser | undefined) {
    if (currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin role is required');
    }
  }

  private toHttpException(error: unknown) {
    if (!(error instanceof UserUseCaseError)) {
      return new BadRequestException('User request failed');
    }

    if (error.reason === UserFailureReason.UserMissing) {
      return new NotFoundException(error.message);
    }

    if (error.reason === UserFailureReason.EmailAlreadyExists) {
      return new ConflictException(error.message);
    }

    return new BadRequestException(error.message);
  }

  private toUpdateInput(body: UpdateUserDto): UpdateUserInput {
    return {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      imageUrl: body.imgUrl,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
    };
  }

  private presentUser(user: UserRecord) {
    return {
      id: user.id,
      email: user.email,
      type: user.type,
      status: user.status,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().slice(0, 10)
        : null,
      gender: user.gender,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
