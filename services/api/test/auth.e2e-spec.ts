import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { RefreshTokensUseCase } from '@/auth/application/use-cases/refresh-tokens/refresh-tokens.use-case';
import { RegisterUseCase } from '@/auth/application/use-cases/register/register.use-case';
import { SignInUseCase } from '@/auth/application/use-cases/sign-in/sign-in.use-case';
import { SignOutUseCase } from '@/auth/application/use-cases/sign-out/sign-out.use-case';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token/validate-access-token.use-case';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { AuthController } from '@/auth/interfaces/http/auth.controller';
import { HttpExceptionFilter } from '@/shared/response/http-exception.filter';
import { ResponseInterceptor } from '@/shared/response/response.interceptor';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  const currentUser: AuthenticatedUser = {
    userId: 'user-1',
    sessionId: 'session-1',
    email: 'user@example.com',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
  };

  const registerAccount = { execute: jest.fn() };
  const signIn = { execute: jest.fn() };
  const refreshTokens = { execute: jest.fn() };
  const validateAccessToken = { execute: jest.fn() };
  const signOut = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    registerAccount.execute.mockResolvedValue(undefined);
    signIn.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    refreshTokens.execute.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    validateAccessToken.execute.mockResolvedValue(currentUser);
    signOut.execute.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        JwtAuthGuard,
        { provide: RegisterUseCase, useValue: registerAccount },
        { provide: SignInUseCase, useValue: signIn },
        { provide: RefreshTokensUseCase, useValue: refreshTokens },
        { provide: ValidateAccessTokenUseCase, useValue: validateAccessToken },
        { provide: SignOutUseCase, useValue: signOut },
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

  it('POST /auth/login returns exactly accessToken and refreshToken in data', async () => {
    const response = await request(server())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' })
      .expect(200);
    const body = response.body as { data: Record<string, unknown> };

    expect(body).toEqual({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });
    expect(Object.keys(body.data)).toEqual(['accessToken', 'refreshToken']);
  });

  it('POST /auth/register stores a student registration without issuing tokens', async () => {
    const response = await request(server())
      .post('/auth/register')
      .send({
        email: 'student@example.com',
        password: '12345678',
        firstName: 'Student',
        lastName: 'User',
        dateOfBirth: '2000-01-02',
        gender: 'FEMALE',
      })
      .expect(201);
    const body = response.body as { data: Record<string, unknown> };

    expect(body).toEqual({
      success: true,
      message: 'Registration successful',
      data: {},
    });
    expect(registerAccount.execute).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: '12345678',
      firstName: 'Student',
      lastName: 'User',
      dateOfBirth: '2000-01-02',
      gender: 'FEMALE',
    });
    expect(Object.keys(body.data)).toEqual([]);
  });

  it('POST /auth/register denies reserved admin registration', async () => {
    registerAccount.execute.mockRejectedValueOnce(
      new AuthUseCaseError(
        AuthFailureReason.ReservedAdminEmail,
        'Admin account cannot be registered',
      ),
    );

    await request(server())
      .post('/auth/register')
      .send({
        email: 'Admin@admin.com',
        password: '12345678',
        firstName: 'Admin',
        lastName: 'User',
        dateOfBirth: '2000-01-02',
        gender: 'MALE',
      })
      .expect(403)
      .expect({
        success: false,
        message: 'Admin account cannot be registered',
        data: {},
      });
  });

  it('POST /auth/login denies invalid credentials with a safe envelope', async () => {
    signIn.execute.mockRejectedValueOnce(
      new AuthUseCaseError(AuthFailureReason.InvalidCredentials),
    );

    await request(server())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(401)
      .expect({
        success: false,
        message: 'Authentication failed',
        data: {},
      });
  });

  it('POST /auth/login denies inactive accounts', async () => {
    signIn.execute.mockRejectedValueOnce(
      new AuthUseCaseError(
        AuthFailureReason.AccountInactive,
        'Account is not allowed to sign in',
      ),
    );

    await request(server())
      .post('/auth/login')
      .send({ email: 'inactive@example.com', password: 'Password123!' })
      .expect(403)
      .expect({
        success: false,
        message: 'Account is not allowed to sign in',
        data: {},
      });
  });

  it('POST /auth/refresh rotates a refresh token', async () => {
    const response = await request(server())
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh-token' })
      .expect(200);
    const body = response.body as { data: Record<string, unknown> };

    expect(Object.keys(body.data)).toEqual(['accessToken', 'refreshToken']);
  });

  it('POST /auth/refresh denies reused tokens', async () => {
    refreshTokens.execute.mockRejectedValueOnce(
      new AuthUseCaseError(AuthFailureReason.RefreshReused),
    );

    await request(server())
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh-token' })
      .expect(401)
      .expect({
        success: false,
        message: 'Authentication failed',
        data: {},
      });
  });

  it('POST /auth/logout revokes the current session', async () => {
    await request(server())
      .post('/auth/logout')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        success: true,
        message: 'Logout successful',
        data: {},
      });

    expect(signOut.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      userId: 'user-1',
    });
  });
});
