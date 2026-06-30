import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { GetCurrentUserUseCase } from '@/auth/application/use-cases/get-current-user/get-current-user.use-case';
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

  const signIn = { execute: jest.fn() };
  const register = { execute: jest.fn() };
  const refreshTokens = { execute: jest.fn() };
  const validateAccessToken = { execute: jest.fn() };
  const getCurrentUser = { execute: jest.fn() };
  const signOut = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    register.execute.mockResolvedValue({
      id: 'registered-user-1',
      email: 'new.user@example.com',
      status: 'ACTIVE',
      role: 'STUDENT',
      firstName: 'New',
      lastName: 'User',
      gender: 'MALE',
      dateOfBirth: new Date('2001-04-12T00:00:00.000Z'),
    });
    signIn.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    refreshTokens.execute.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    validateAccessToken.execute.mockResolvedValue(currentUser);
    getCurrentUser.execute.mockResolvedValue(currentUser);
    signOut.execute.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        JwtAuthGuard,
        { provide: RegisterUseCase, useValue: register },
        { provide: SignInUseCase, useValue: signIn },
        { provide: RefreshTokensUseCase, useValue: refreshTokens },
        { provide: ValidateAccessTokenUseCase, useValue: validateAccessToken },
        { provide: GetCurrentUserUseCase, useValue: getCurrentUser },
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

  it('documents auth endpoints in OpenAPI with request, auth, and envelope responses', () => {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );

    expect(swaggerDocument.paths['/auth/register']).toBeDefined();
    expect(swaggerDocument.paths['/auth/login']).toBeDefined();
    expect(swaggerDocument.paths['/auth/refresh']).toBeDefined();
    expect(swaggerDocument.paths['/auth/me']).toBeDefined();
    expect(swaggerDocument.paths['/auth/logout']).toBeDefined();

    const registerPost = swaggerDocument.paths['/auth/register']?.post;
    const loginPost = swaggerDocument.paths['/auth/login']?.post;
    const refreshPost = swaggerDocument.paths['/auth/refresh']?.post;
    const meGet = swaggerDocument.paths['/auth/me']?.get;
    const logoutPost = swaggerDocument.paths['/auth/logout']?.post;

    expect(registerPost?.requestBody).toBeDefined();
    expect(registerPost?.responses?.['201']).toBeDefined();
    expect(registerPost?.responses?.['400']).toBeDefined();
    expect(registerPost?.responses?.['409']).toBeDefined();
    expect(loginPost?.requestBody).toBeDefined();
    expect(loginPost?.responses?.['200']).toBeDefined();
    expect(loginPost?.responses?.['400']).toBeDefined();
    expect(loginPost?.responses?.['401']).toBeDefined();
    expect(loginPost?.responses?.['403']).toBeDefined();
    expect(refreshPost?.requestBody).toBeDefined();
    expect(refreshPost?.responses?.['200']).toBeDefined();
    expect(refreshPost?.responses?.['400']).toBeDefined();
    expect(refreshPost?.responses?.['401']).toBeDefined();
    expect(meGet?.security).toBeDefined();
    expect(meGet?.responses?.['200']).toBeDefined();
    expect(meGet?.responses?.['401']).toBeDefined();
    expect(logoutPost?.security).toBeDefined();
    expect(logoutPost?.responses?.['200']).toBeDefined();
    expect(logoutPost?.responses?.['401']).toBeDefined();
  });

  it('POST /auth/register creates a student account', async () => {
    await request(server())
      .post('/auth/register')
      .send({
        email: 'new.user@example.com',
        password: 'Password123!',
        firstname: 'New',
        lastname: 'User',
        gender: 'MALE',
        dataofbirth: '2001-04-12',
      })
      .expect(201)
      .expect({
        success: true,
        message: 'Registration successful',
        data: {
          id: 'registered-user-1',
          email: 'new.user@example.com',
          status: 'ACTIVE',
          role: 'STUDENT',
          firstName: 'New',
          lastName: 'User',
          gender: 'MALE',
          dateOfBirth: '2001-04-12T00:00:00.000Z',
        },
      });

    expect(register.execute).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      password: 'Password123!',
      firstname: 'New',
      lastname: 'User',
      gender: 'MALE',
      dataofbirth: '2001-04-12',
    });
  });

  it('POST /auth/register denies duplicate emails', async () => {
    register.execute.mockRejectedValueOnce(
      new AuthUseCaseError(
        AuthFailureReason.EmailAlreadyRegistered,
        'Email is already registered',
      ),
    );

    await request(server())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        firstname: 'Test',
        lastname: 'User',
        gender: 'FEMALE',
        dataofbirth: '2001-04-12',
      })
      .expect(409)
      .expect({
        success: false,
        message: 'Email is already registered',
        data: {},
      });
  });

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

  it('GET /auth/me returns the authenticated user for a valid bearer token', async () => {
    await request(server())
      .get('/auth/me')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        success: true,
        message: 'Current user retrieved',
        data: {
          id: 'user-1',
          email: 'user@example.com',
          status: 'ACTIVE',
          role: 'STUDENT',
          firstName: 'Test',
          lastName: 'User',
          imageUrl: null,
        },
      });
  });

  it('GET /auth/me denies requests without bearer tokens', async () => {
    await request(server()).get('/auth/me').expect(401).expect({
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
