import { INestApplication } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { CreateUserUseCase } from '@/users/application/use-cases/create-user/create-user.use-case';
import { DeleteUserUseCase } from '@/users/application/use-cases/delete-user/delete-user.use-case';
import { GetCurrentUserUseCase } from '@/users/application/use-cases/get-current-user/get-current-user.use-case';
import { GetUserUseCase } from '@/users/application/use-cases/get-user/get-user.use-case';
import { ListUsersUseCase } from '@/users/application/use-cases/list-users/list-users.use-case';
import { UpdateUserRoleUseCase } from '@/users/application/use-cases/update-user-role/update-user-role.use-case';
import { UpdateUserUseCase } from '@/users/application/use-cases/update-user/update-user.use-case';
import { UserController } from '@/users/interfaces/http/user.controller';
import { HttpExceptionFilter } from '@/shared/response/http-exception.filter';
import { ResponseInterceptor } from '@/shared/response/response.interceptor';

describe('User API (e2e)', () => {
  let app: INestApplication;
  let currentUser: AuthenticatedUser;

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    type: 'EMAIL',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    dateOfBirth: new Date('2000-01-02T00:00:00.000Z'),
    gender: 'FEMALE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const createUser = { execute: jest.fn() };
  const deleteUser = { execute: jest.fn() };
  const getCurrentUser = { execute: jest.fn() };
  const getUser = { execute: jest.fn() };
  const listUsers = { execute: jest.fn() };
  const updateUserRole = { execute: jest.fn() };
  const updateUser = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    currentUser = {
      userId: 'user-1',
      sessionId: 'session-1',
      email: 'user@example.com',
      status: 'ACTIVE',
      role: 'STUDENT',
      firstName: 'Test',
      lastName: 'User',
      imageUrl: null,
    };
    createUser.execute.mockResolvedValue({ ...user, id: 'created-user-1' });
    deleteUser.execute.mockResolvedValue(undefined);
    getCurrentUser.execute.mockResolvedValue(user);
    getUser.execute.mockResolvedValue(user);
    listUsers.execute.mockResolvedValue([user]);
    updateUserRole.execute.mockResolvedValue({ ...user, role: 'RESEARCHER' });
    updateUser.execute.mockResolvedValue({ ...user, status: 'INACTIVE' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: CreateUserUseCase, useValue: createUser },
        { provide: DeleteUserUseCase, useValue: deleteUser },
        { provide: GetCurrentUserUseCase, useValue: getCurrentUser },
        { provide: GetUserUseCase, useValue: getUser },
        { provide: ListUsersUseCase, useValue: listUsers },
        { provide: UpdateUserRoleUseCase, useValue: updateUserRole },
        { provide: UpdateUserUseCase, useValue: updateUser },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          context
            .switchToHttp()
            .getRequest<{ user?: AuthenticatedUser }>().user = currentUser;
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  function server(): App {
    return app.getHttpServer() as App;
  }

  it('GET /users/me returns only the authenticated user for students', async () => {
    await request(server())
      .get('/users/me')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        success: true,
        message: 'Current user retrieved',
        data: {
          id: 'user-1',
          email: 'user@example.com',
          type: 'EMAIL',
          status: 'ACTIVE',
          role: 'STUDENT',
          firstName: 'Test',
          lastName: 'User',
          imageUrl: null,
          dateOfBirth: '2000-01-02',
          gender: 'FEMALE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      });

    expect(getCurrentUser.execute).toHaveBeenCalledWith(currentUser);
  });

  it('GET /users denies non-admin list access', async () => {
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

  it('GET /users returns managed users for admins', async () => {
    currentUser = { ...currentUser, role: 'ADMIN' };

    const response = await request(server())
      .get('/users')
      .set('Authorization', 'Bearer access-token')
      .expect(200);
    const body = response.body as { data: { users: unknown[] } };

    expect(body.data.users).toHaveLength(1);
    expect(listUsers.execute).toHaveBeenCalled();
  });

  it('POST /users creates users for admins', async () => {
    currentUser = { ...currentUser, role: 'ADMIN' };

    await request(server())
      .post('/users')
      .set('Authorization', 'Bearer access-token')
      .send({
        email: 'researcher@example.com',
        password: 'Password123!',
        type: 'EMAIL',
        status: 'ACTIVE',
        role: 'RESEARCHER',
      })
      .expect(201);

    expect(createUser.execute).toHaveBeenCalledWith({
      email: 'researcher@example.com',
      password: 'Password123!',
      type: 'EMAIL',
      status: 'ACTIVE',
      role: 'RESEARCHER',
    });
  });

  it('PATCH /users/:id updates users for admins', async () => {
    currentUser = { ...currentUser, role: 'ADMIN' };

    await request(server())
      .patch('/users/user-1')
      .set('Authorization', 'Bearer access-token')
      .send({
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        imgUrl: 'https://example.com/avatar.png',
        dateOfBirth: '1999-12-31',
        gender: 'OTHER',
        type: 'GOOGLE',
        status: 'INACTIVE',
        role: 'RESEARCHER',
        password: 'NewPassword123!',
      })
      .expect(200);

    expect(updateUser.execute).toHaveBeenCalledWith('user-1', {
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      imageUrl: 'https://example.com/avatar.png',
      dateOfBirth: '1999-12-31',
      gender: 'OTHER',
    });
  });

  it('PATCH /users/:id/role updates researcher or student roles for admins', async () => {
    currentUser = { ...currentUser, role: 'ADMIN' };

    await request(server())
      .patch('/users/user-1/role')
      .set('Authorization', 'Bearer access-token')
      .send({ role: 'RESEARCHER' })
      .expect(200);

    expect(updateUserRole.execute).toHaveBeenCalledWith('user-1', {
      role: 'RESEARCHER',
    });
  });

  it('DELETE /users/:id deletes users for admins', async () => {
    currentUser = { ...currentUser, role: 'ADMIN' };

    await request(server())
      .delete('/users/user-1')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        success: true,
        message: 'User deleted',
        data: {},
      });

    expect(deleteUser.execute).toHaveBeenCalledWith('user-1');
  });
});
