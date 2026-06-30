import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token.use-case';

type AuthRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly validateAccessTokenUseCase: ValidateAccessTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.getBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication failed');
    }

    try {
      request.user = await this.validateAccessTokenUseCase.execute(token);
      return true;
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private getBearerToken(header: string | undefined): string | null {
    if (!header) {
      return null;
    }

    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
