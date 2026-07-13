import {
  AuthEventLogger,
  AuthSessionRecord,
  CreateAdminInput,
  CreateSessionInput,
  CreateUserInput,
  PasswordHasher,
  RotateSessionInput,
  SessionRepository,
  TokenService,
  UserAuthRecord,
  UserRegistrationRecord,
  UserRepository,
} from '@/auth/application/ports/auth.ports';

export function fakeUsers(
  override: Partial<UserAuthRecord> = {},
): UserRepository & {
  createdStudents: CreateUserInput[];
  ensuredAdmins: CreateAdminInput[];
} {
  const user: UserAuthRecord = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hash',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    ...override,
  };
  const createdStudents: CreateUserInput[] = [];
  const ensuredAdmins: CreateAdminInput[] = [];

  return {
    createdStudents,
    ensuredAdmins,
    findByEmail: jest.fn(() => Promise.resolve(user)),
    findById: jest.fn(() => Promise.resolve(user)),
    createStudent: jest.fn((input) => {
      createdStudents.push(input);
      return Promise.resolve<UserRegistrationRecord>({
        id: 'created-user-1',
        email: input.email,
        status: 'ACTIVE',
        role: 'STUDENT',
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
      });
    }),
    ensureAdmin: jest.fn((input) => {
      ensuredAdmins.push(input);
      return Promise.resolve({
        ...user,
        email: input.email,
        password: input.passwordHash,
        role: 'ADMIN',
      });
    }),
  };
}

export function fakeHasher(matches: boolean): PasswordHasher {
  return {
    verify: jest.fn(() => Promise.resolve(matches)),
    hash: jest.fn((plainText) => Promise.resolve(`hash:${plainText}`)),
  };
}

export function fakeTokens(): TokenService {
  return {
    issueAccessToken: jest.fn(() => Promise.resolve('access-token')),
    verifyAccessToken: jest.fn(() =>
      Promise.resolve({
        sub: 'user-1',
        jti: 'access-jti',
        role: 'STUDENT',
      }),
    ),
    createRefreshToken: jest.fn(() => 'refresh-token-value'),
    hashOpaqueValue: jest.fn((value) => `hash:${value}`),
  };
}

export function fakeAudit(): AuthEventLogger & { events: unknown[] } {
  const events: unknown[] = [];
  return {
    events,
    record: jest.fn((event) => {
      events.push(event);
      return Promise.resolve();
    }),
  };
}

export function fakeSessions(
  options: {
    revoked?: boolean;
    refreshSession?: AuthSessionRecord | null;
  } = {},
): SessionRepository & {
  created: CreateSessionInput[];
  rotated: RotateSessionInput[];
  revoked: string[];
} {
  const session: AuthSessionRecord = options.refreshSession ?? {
    id: 'session-1',
    userId: 'user-1',
    accessTokenIdHash: 'hash:access-jti',
    refreshTokenHash: 'hash:refresh-token-value',
    issuedAt: new Date(),
    accessTokenExpiresAt: new Date(Date.now() + 60_000),
    refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    revokedAt: options.revoked ? new Date() : null,
    lastUsedAt: null,
    rotatedAt: null,
  };
  const created: CreateSessionInput[] = [];
  const rotated: RotateSessionInput[] = [];
  const revoked: string[] = [];

  return {
    created,
    rotated,
    revoked,
    create: jest.fn((input) => {
      created.push(input);
      return Promise.resolve({ ...session, ...input });
    }),
    findByRefreshTokenHash: jest.fn(() =>
      Promise.resolve(options.refreshSession === null ? null : session),
    ),
    findByAccessTokenIdHash: jest.fn(() => Promise.resolve(session)),
    rotate: jest.fn((input) => {
      rotated.push(input);
      return Promise.resolve({ ...session, ...input, id: input.sessionId });
    }),
    revokeById: jest.fn((sessionId) => {
      revoked.push(sessionId);
      return Promise.resolve();
    }),
    touch: jest.fn(() => Promise.resolve()),
  };
}
