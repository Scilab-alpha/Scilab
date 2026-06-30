import {
  AuthenticatedUser,
  AuthEventLogger,
  SessionRepository,
  TokenService,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { AuthEventType } from '@/auth/domain/auth-event';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { ValidateAccessTokenInput } from './validate-access-token.input';

export class ValidateAccessTokenUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly audit: AuthEventLogger,
  ) {}

  async execute(
    accessToken: ValidateAccessTokenInput,
  ): Promise<AuthenticatedUser> {
    const now = new Date();
    const claims = await this.tokens.verifyAccessToken(accessToken);
    const session = await this.sessions.findByAccessTokenIdHash(
      this.tokens.hashOpaqueValue(claims.jti),
    );

    if (!session) {
      await this.auditDenied(AuthFailureReason.TokenMalformed, claims.sub);
      throw new AuthUseCaseError(AuthFailureReason.TokenMalformed);
    }

    if (session.revokedAt) {
      await this.auditDenied(AuthFailureReason.TokenRevoked, session.userId);
      throw new AuthUseCaseError(AuthFailureReason.TokenRevoked);
    }

    if (session.accessTokenExpiresAt <= now) {
      await this.auditDenied(AuthFailureReason.TokenExpired, session.userId);
      throw new AuthUseCaseError(AuthFailureReason.TokenExpired);
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.auditDenied(AuthFailureReason.UserMissing, session.userId);
      throw new AuthUseCaseError(AuthFailureReason.UserMissing);
    }

    await this.sessions.touch(session.id, now);
    return {
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      status: user.status,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    };
  }

  private async auditDenied(reason: AuthFailureReason, userId?: string) {
    await this.audit.record({
      type: AuthEventType.TokenDenied,
      occurredAt: new Date(),
      userId,
      reason,
    });
  }
}
