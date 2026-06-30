import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { GetCurrentUserUseCase } from '@/auth/application/use-cases/get-current-user/get-current-user.use-case';
import { RefreshTokensUseCase } from '@/auth/application/use-cases/refresh-tokens/refresh-tokens.use-case';
import { RegisterUseCase } from '@/auth/application/use-cases/register/register.use-case';
import { SignInUseCase } from '@/auth/application/use-cases/sign-in/sign-in.use-case';
import { SignOutUseCase } from '@/auth/application/use-cases/sign-out/sign-out.use-case';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import {
  LoginDto,
  RefreshDto,
  RegisterDto,
} from '@/auth/interfaces/http/auth.dto';
import {
  ApiCurrentUser,
  ApiLogin,
  ApiLogout,
  ApiRefresh,
  ApiRegister,
} from '@/auth/interfaces/http/auth.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly signOutUseCase: SignOutUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiRegister()
  async register(@Body() body: RegisterDto) {
    try {
      const user = await this.registerUseCase.execute(body);
      return createSuccessResponse(user, 'Registration successful');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('login')
  @HttpCode(200)
  @ApiLogin()
  async login(@Body() body: LoginDto) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('Email and password are required');
    }

    try {
      const tokens = await this.signInUseCase.execute(body);
      return createSuccessResponse(tokens, 'Authentication successful');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiRefresh()
  async refresh(@Body() body: RefreshDto) {
    if (!body?.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const tokens = await this.refreshTokensUseCase.execute({
        refreshToken: body.refreshToken,
      });
      return createSuccessResponse(tokens, 'Authentication refreshed');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCurrentUser()
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.getCurrentUserUseCase.execute({
      currentUser,
    });
    return createSuccessResponse(
      {
        id: user.userId,
        email: user.email,
        status: user.status,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
      'Current user retrieved',
    );
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiLogout()
  async logout(@CurrentUser() currentUser: AuthenticatedUser) {
    await this.signOutUseCase.execute({
      sessionId: currentUser.sessionId,
      userId: currentUser.userId,
    });
    return createSuccessResponse({}, 'Logout successful');
  }

  private toHttpException(error: unknown) {
    if (error instanceof AuthUseCaseError) {
      if (error.reason === AuthFailureReason.AccountInactive) {
        return new ForbiddenException(error.message);
      }

      if (error.reason === AuthFailureReason.EmailAlreadyRegistered) {
        return new ConflictException(error.message);
      }

      if (error.reason === AuthFailureReason.InvalidRegistrationInput) {
        return new BadRequestException(error.message);
      }
    }

    return new UnauthorizedException('Authentication failed');
  }
}
