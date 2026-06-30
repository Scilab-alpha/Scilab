import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from '@/auth/application/auth.constants';
import {
  AuthEventLogger,
  SessionRepository,
  TokenService,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { AuthEventType } from '@/auth/domain/auth-event';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import {
  TokenPair,
  createTokenPair,
} from '@/auth/domain/value-objects/token-pair.value-object';
import { RefreshTokensInput } from '@/auth/application/use-cases/refresh-tokens/refresh-tokens.dto';
import { randomUUID } from 'crypto';

export class RefreshTokensUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly audit: AuthEventLogger,
  ) {}

  async execute(input: RefreshTokensInput): Promise<TokenPair> {
    const { refreshToken } = input;
    const now = new Date();
    if (!refreshToken || refreshToken.trim().length < 16) {
      await this.auditRefreshFailure(AuthFailureReason.TokenMalformed);
      throw new AuthUseCaseError(AuthFailureReason.TokenMalformed);
    }

    const session = await this.sessions.findByRefreshTokenHash(
      this.tokens.hashOpaqueValue(refreshToken),
    );
    if (!session) {
      await this.auditRefreshFailure(AuthFailureReason.RefreshReused);
      throw new AuthUseCaseError(AuthFailureReason.RefreshReused);
    }

    if (session.revokedAt) {
      await this.auditRefreshFailure(
        AuthFailureReason.TokenRevoked,
        session.userId,
      );
      throw new AuthUseCaseError(AuthFailureReason.TokenRevoked);
    }

    if (session.refreshTokenExpiresAt <= now) {
      await this.sessions.revokeById(session.id, now);
      await this.auditRefreshFailure(
        AuthFailureReason.TokenExpired,
        session.userId,
      );
      throw new AuthUseCaseError(AuthFailureReason.TokenExpired);
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.sessions.revokeById(session.id, now);
      await this.auditRefreshFailure(
        AuthFailureReason.UserMissing,
        session.userId,
      );
      throw new AuthUseCaseError(AuthFailureReason.UserMissing);
    }

    const accessJti = randomUUID();
    const nextRefreshToken = this.tokens.createRefreshToken();
    const accessToken = await this.tokens.issueAccessToken({
      userId: user.id,
      role: user.role,
      jti: accessJti,
    });

    await this.sessions.rotate({
      sessionId: session.id,
      accessTokenIdHash: this.tokens.hashOpaqueValue(accessJti),
      refreshTokenHash: this.tokens.hashOpaqueValue(nextRefreshToken),
      issuedAt: now,
      accessTokenExpiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
    });

    await this.audit.record({
      type: AuthEventType.TokenRefreshSuccess,
      occurredAt: now,
      userId: user.id,
    });

    return createTokenPair(accessToken, nextRefreshToken);
  }

  private async auditRefreshFailure(
    reason: AuthFailureReason,
    userId?: string,
  ) {
    await this.audit.record({
      type: AuthEventType.TokenRefreshFailure,
      occurredAt: new Date(),
      userId,
      reason,
    });
  }
}
