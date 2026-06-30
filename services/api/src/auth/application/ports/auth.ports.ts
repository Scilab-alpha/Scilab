import { AuthEvent } from '@/auth/domain/auth-event';

export interface UserAuthRecord {
  id: string;
  email: string;
  password: string;
  status: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  accessTokenIdHash: string;
  refreshTokenHash: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  rotatedAt: Date | null;
}

export interface CreateSessionInput {
  userId: string;
  accessTokenIdHash: string;
  refreshTokenHash: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface RotateSessionInput {
  sessionId: string;
  accessTokenIdHash: string;
  refreshTokenHash: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  email: string;
  status: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface AccessTokenClaims {
  sub: string;
  jti: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface IssuedAccessToken {
  token: string;
  jti: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserAuthRecord | null>;
  findById(id: string): Promise<UserAuthRecord | null>;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<AuthSessionRecord>;
  findByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null>;
  findByAccessTokenIdHash(hash: string): Promise<AuthSessionRecord | null>;
  rotate(input: RotateSessionInput): Promise<AuthSessionRecord>;
  revokeById(sessionId: string, revokedAt: Date): Promise<void>;
  touch(sessionId: string, usedAt: Date): Promise<void>;
}

export interface PasswordHasher {
  verify(hash: string, plainText: string): Promise<boolean>;
  hash(plainText: string): Promise<string>;
}

export interface TokenService {
  issueAccessToken(input: {
    userId: string;
    role: string;
    jti: string;
  }): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
  createRefreshToken(): string;
  hashOpaqueValue(value: string): string;
}

export interface AuthEventLogger {
  record(event: AuthEvent): Promise<void>;
}
