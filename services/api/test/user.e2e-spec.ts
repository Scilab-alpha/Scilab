import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token/validate-access-token.use-case';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { DeleteUserUseCase } from '@/user/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserProfileUseCase } from '@/user/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserByIdUseCase } from '@/user/application/use-cases/get-user-by-id/get-user-by-id.use-case';
import { ListUsersUseCase } from '@/user/application/use-cases/list-users/list-users.use-case';
import { UpdateCurrentUserProfileUseCase } from '@/user/application/use-cases/update-current-user/update-current-user.use-case';
import { UpdateUserUseCase } from '@/user/application/use-cases/update-user/update-user.use-case';
import { UpdateUserRoleUseCase } from '@/user/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '@/user/application/use-cases/update-user-status/update-user-status.use-case';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';
import { UserController } from '@/user/interfaces/http/user.controller';
import { HttpExceptionFilter } from '@/shared/response/http-exception.filter';
import { ResponseInterceptor } from '@/shared/response/response.interceptor';

describe('User API (e2e)', () => {
  let app: INestApplication;

  const studentUser: AuthenticatedUser = {
    userId: 'user-1',
    sessionId: 'session-1',
    email: 'user@example.com',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
  };
  const adminUser: AuthenticatedUser = {
    ...studentUser,
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  };
  const profile = {
    id: 'user-1',
    email: 'user@example.com',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    gender: 'MALE',
    dateOfBirth: new Date('2001-04-12T00:00:00.000Z'),
  };

  const validateAccessToken = { execute: jest.fn() };
  const getCurrentUser = { execute: jest.fn() };
  const updateCurrentUser = { execute: jest.fn() };
  const listUsers = { execute: jest.fn() };
  const getUserById = { execute: jest.fn() };
  const updateUser = { execute: jest.fn() };
  const updateUserRole = { execute: jest.fn() };
  const updateUserStatus = { execute: jest.fn() };
  const deleteUser = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    validateAccessToken.execute.mockImplementation(
      ({ accessToken }: { accessToken: string }) =>
        Promise.resolve(
          accessToken === 'admin-token' ? adminUser : studentUser,
        ),
    );
    getCurrentUser.execute.mockResolvedValue(profile);
    updateCurrentUser.execute.mockResolvedValue({
      ...profile,
      firstName: 'Updated',
    });
    listUsers.execute.mockResolvedValue({ users: [profile] });
    getUserById.execute.mockResolvedValue(profile);
    updateUser.execute.mockResolvedValue({ ...profile, lastName: 'AdminEdit' });
    updateUserRole.execute.mockResolvedValue({
      ...profile,
      role: 'RESEARCHER',
    });
    updateUserStatus.execute.mockResolvedValue({
      ...profile,
      status: 'BANNED',
    });
    deleteUser.execute.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        JwtAuthGuard,
        AdminGuard,
        { provide: ValidateAccessTokenUseCase, useValue: validateAccessToken },
        { provide: GetCurrentUserProfileUseCase, useValue: getCurrentUser },
        {
          provide: UpdateCurrentUserProfileUseCase,
          useValue: updateCurrentUser,
        },
        { provide: ListUsersUseCase, useValue: listUsers },
        { provide: GetUserByIdUseCase, useValue: getUserById },
        { provide: UpdateUserUseCase, useValue: updateUser },
        { provide: UpdateUserRoleUseCase, useValue: updateUserRole },
        { provide: UpdateUserStatusUseCase, useValue: updateUserStatus },
        { provide: DeleteUserUseCase, useValue: deleteUser },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function server(): App {
    return app.getHttpServer() as App;
  }

  it('documents user endpoints in OpenAPI with auth, bodies, params, and envelope responses', () => {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );

    expect(swaggerDocument.paths['/users/me']).toBeDefined();
    expect(swaggerDocument.paths['/users']).toBeDefined();
    expect(swaggerDocument.paths['/users/{userId}']).toBeDefined();
    expect(swaggerDocument.paths['/users/{userId}/role']).toBeDefined();
    expect(swaggerDocument.paths['/users/{userId}/status']).toBeDefined();

    const meGet = swaggerDocument.paths['/users/me']?.get;
    const mePatch = swaggerDocument.paths['/users/me']?.patch;
    const usersGet = swaggerDocument.paths['/users']?.get;
    const userPatch = swaggerDocument.paths['/users/{userId}']?.patch;
    const rolePatch = swaggerDocument.paths['/users/{userId}/role']?.patch;
    const statusPatch = swaggerDocument.paths['/users/{userId}/status']?.patch;

    expect(meGet?.security).toBeDefined();
    expect(mePatch?.requestBody).toBeDefined();
    expect(usersGet?.responses?.['200']).toBeDefined();
    expect(usersGet?.responses?.['401']).toBeDefined();
    expect(usersGet?.responses?.['403']).toBeDefined();
    expect(userPatch?.parameters).toBeDefined();
    expect(userPatch?.requestBody).toBeDefined();
    expect(rolePatch?.requestBody).toBeDefined();
    expect(statusPatch?.requestBody).toBeDefined();
  });

  it('GET /users/me returns the authenticated user profile', async () => {
    await request(server())
      .get('/users/me')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        success: true,
        message: 'User retrieved',
        data: {
          ...profile,
          dateOfBirth: '2001-04-12T00:00:00.000Z',
        },
      });

    expect(getCurrentUser.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('PATCH /users/me updates the authenticated user profile', async () => {
    await request(server())
      .patch('/users/me')
      .set('Authorization', 'Bearer access-token')
      .send({
        email: 'updated@example.com',
        firstname: 'Updated',
        lastname: 'User',
        gender: 'FEMALE',
        dateofbirth: '2002-05-13',
      })
      .expect(200);

    expect(updateCurrentUser.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      data: {
        email: 'updated@example.com',
        firstname: 'Updated',
        lastname: 'User',
        gender: 'FEMALE',
        dateofbirth: '2002-05-13',
      },
    });
  });

  it('GET /users denies non-admin users', async () => {
    await request(server())
      .get('/users')
      .set('Authorization', 'Bearer access-token')
      .expect(403)
      .expect({
        success: false,
        message: 'Admin role is required',
        data: {},
      });
  });

  it('GET /users returns users for admins', async () => {
    await request(server())
      .get('/users')
      .set('Authorization', 'Bearer admin-token')
      .expect(200)
      .expect({
        success: true,
        message: 'Users retrieved',
        data: {
          users: [
            {
              ...profile,
              dateOfBirth: '2001-04-12T00:00:00.000Z',
            },
          ],
        },
      });
  });

  it('PATCH admin endpoints update user data, role, and status by userId', async () => {
    await request(server())
      .patch('/users/user-1')
      .set('Authorization', 'Bearer admin-token')
      .send({ lastname: 'AdminEdit' })
      .expect(200);
    await request(server())
      .patch('/users/user-1/role')
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'RESEARCHER' })
      .expect(200);
    await request(server())
      .patch('/users/user-1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'BANNED' })
      .expect(200);

    expect(updateUser.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      data: { lastname: 'AdminEdit' },
    });
    expect(updateUserRole.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      role: 'RESEARCHER',
    });
    expect(updateUserStatus.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      status: 'BANNED',
    });
  });

  it('DELETE /users/:userId deletes a user for admins with an envelope', async () => {
    await request(server())
      .delete('/users/user-1')
      .set('Authorization', 'Bearer admin-token')
      .expect(200)
      .expect({
        success: true,
        message: 'User deleted',
        data: {},
      });

    expect(deleteUser.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
