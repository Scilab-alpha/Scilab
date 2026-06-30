import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from '@/auth/application/auth.constants';
import {
  AuthEventLogger,
  PasswordHasher,
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
import { randomUUID } from 'crypto';

export interface SignInInput {
  email: string;
  password: string;
}

export class SignInUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly audit: AuthEventLogger,
  ) {}

  async execute(input: SignInInput): Promise<TokenPair> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user) {
      await this.auditFailure(email, AuthFailureReason.InvalidCredentials);
      throw new AuthUseCaseError(AuthFailureReason.InvalidCredentials);
    }

    if (user.status !== 'ACTIVE') {
      await this.auditFailure(
        email,
        AuthFailureReason.AccountInactive,
        user.id,
      );
      throw new AuthUseCaseError(
        AuthFailureReason.AccountInactive,
        'Account is not allowed to sign in',
      );
    }

    const passwordMatches = await this.passwordHasher.verify(
      user.password,
      input.password,
    );
    if (!passwordMatches) {
      await this.auditFailure(
        email,
        AuthFailureReason.InvalidCredentials,
        user.id,
      );
      throw new AuthUseCaseError(AuthFailureReason.InvalidCredentials);
    }

    const now = new Date();
    const accessJti = randomUUID();
    const refreshToken = this.tokens.createRefreshToken();
    const accessToken = await this.tokens.issueAccessToken({
      userId: user.id,
      role: user.role,
      jti: accessJti,
    });

    await this.sessions.create({
      userId: user.id,
      accessTokenIdHash: this.tokens.hashOpaqueValue(accessJti),
      refreshTokenHash: this.tokens.hashOpaqueValue(refreshToken),
      issuedAt: now,
      accessTokenExpiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
    });

    await this.audit.record({
      type: AuthEventType.SignInSuccess,
      occurredAt: now,
      userId: user.id,
      email,
    });

    return createTokenPair(accessToken, refreshToken);
  }

  private async auditFailure(
    email: string,
    reason: AuthFailureReason,
    userId?: string,
  ) {
    await this.audit.record({
      type: AuthEventType.SignInFailure,
      occurredAt: new Date(),
      userId,
      email,
      reason,
    });
  }
}
