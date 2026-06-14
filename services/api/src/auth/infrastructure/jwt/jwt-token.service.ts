import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/auth/application/auth.constants';
import {
  AccessTokenClaims,
  TokenService,
} from '@/auth/application/ports/auth.ports';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async issueAccessToken(input: {
    userId: string;
    role: string;
    jti: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: input.userId,
        jti: input.jti,
        role: input.role,
      },
      {
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        issuer: process.env.JWT_ISSUER ?? 'scilab-api',
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenClaims>(
        token,
        {
          issuer: process.env.JWT_ISSUER ?? 'scilab-api',
        },
      );
      if (!payload.sub || !payload.jti) {
        throw new AuthUseCaseError(AuthFailureReason.TokenMalformed);
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthUseCaseError) {
        throw error;
      }

      if (this.isNamedError(error) && error.name === 'TokenExpiredError') {
        throw new AuthUseCaseError(AuthFailureReason.TokenExpired);
      }

      throw new AuthUseCaseError(AuthFailureReason.TokenMalformed);
    }
  }

  createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashOpaqueValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private isNamedError(error: unknown): error is { name: string } {
    return !!error && typeof error === 'object' && 'name' in error;
  }
}
