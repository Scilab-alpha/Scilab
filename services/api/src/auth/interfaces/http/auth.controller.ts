import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { RefreshTokensUseCase } from '@/auth/application/use-cases/refresh-tokens/refresh-tokens.use-case';
import { RegisterUseCase } from '@/auth/application/use-cases/register/register.use-case';
import { SignInUseCase } from '@/auth/application/use-cases/sign-in/sign-in.use-case';
import { SignOutUseCase } from '@/auth/application/use-cases/sign-out/sign-out.use-case';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import {
  ApiLogin,
  ApiProtected,
  ApiRefresh,
  ApiRegister,
} from '@/auth/interfaces/http/auth.swagger';
import { LoginDto } from '@/auth/interfaces/http/dto/login.dto';
import { RefreshDto } from '@/auth/interfaces/http/dto/refresh.dto';
import { RegisterDto } from '@/auth/interfaces/http/dto/register.dto';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly signOutUseCase: SignOutUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiRegister()
  async register(@Body() body: RegisterDto) {
    if (
      !body?.email ||
      !body?.password ||
      !body?.firstName ||
      !body?.lastName ||
      !body?.dateOfBirth ||
      !body?.gender
    ) {
      throw new BadRequestException('Registration fields are required');
    }

    try {
      await this.registerUseCase.execute(body);
      return createSuccessResponse({}, 'Registration successful');
    } catch (error) {
      throw this.toRegisterHttpException(error);
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
      const tokens = await this.refreshTokensUseCase.execute(body.refreshToken);
      return createSuccessResponse(tokens, 'Authentication refreshed');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiProtected('Revoke the current authenticated session')
  async logout(@CurrentUser() currentUser: AuthenticatedUser) {
    await this.signOutUseCase.execute({
      sessionId: currentUser.sessionId,
      userId: currentUser.userId,
    });
    return createSuccessResponse({}, 'Logout successful');
  }

  private toHttpException(error: unknown) {
    if (
      error instanceof AuthUseCaseError &&
      error.reason === AuthFailureReason.AccountInactive
    ) {
      return new ForbiddenException(error.message);
    }

    return new UnauthorizedException('Authentication failed');
  }

  private toRegisterHttpException(error: unknown) {
    if (!(error instanceof AuthUseCaseError)) {
      return new BadRequestException('Registration failed');
    }

    if (error.reason === AuthFailureReason.EmailAlreadyExists) {
      return new ConflictException(error.message);
    }

    if (error.reason === AuthFailureReason.ReservedAdminEmail) {
      return new ForbiddenException(error.message);
    }

    if (error.reason === AuthFailureReason.InvalidRegistration) {
      return new BadRequestException(error.message);
    }

    return new BadRequestException('Registration failed');
  }
}
