import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthAdminBootstrapService } from '@/auth/application/bootstrap/auth-admin-bootstrap.service';
import { BootstrapAdminUseCase } from '@/auth/application/use-cases/bootstrap-admin/bootstrap-admin.use-case';
import { GetCurrentUserUseCase } from '@/auth/application/use-cases/get-current-user/get-current-user.use-case';
import { RefreshTokensUseCase } from '@/auth/application/use-cases/refresh-tokens/refresh-tokens.use-case';
import { RegisterUseCase } from '@/auth/application/use-cases/register/register.use-case';
import { SignInUseCase } from '@/auth/application/use-cases/sign-in/sign-in.use-case';
import { SignOutUseCase } from '@/auth/application/use-cases/sign-out/sign-out.use-case';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token/validate-access-token.use-case';
import { Argon2PasswordHasher } from '@/auth/infrastructure/crypto/argon2-password-hasher';
import { StructuredAuthEventLogger } from '@/auth/infrastructure/audit/structured-auth-event-logger';
import { JwtTokenService } from '@/auth/infrastructure/jwt/jwt-token.service';
import { PrismaSessionRepository } from '@/auth/infrastructure/persistence/prisma-session.repository';
import { PrismaUserRepository } from '@/auth/infrastructure/persistence/prisma-user.repository';
import { AuthController } from '@/auth/interfaces/http/auth.controller';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'local-dev-change-me',
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaUserRepository,
    PrismaSessionRepository,
    Argon2PasswordHasher,
    JwtTokenService,
    StructuredAuthEventLogger,
    JwtAuthGuard,
    AuthAdminBootstrapService,
    {
      provide: RegisterUseCase,
      useFactory: (
        users: PrismaUserRepository,
        passwordHasher: Argon2PasswordHasher,
        audit: StructuredAuthEventLogger,
      ) => new RegisterUseCase(users, passwordHasher, audit),
      inject: [
        PrismaUserRepository,
        Argon2PasswordHasher,
        StructuredAuthEventLogger,
      ],
    },
    {
      provide: BootstrapAdminUseCase,
      useFactory: (
        users: PrismaUserRepository,
        passwordHasher: Argon2PasswordHasher,
      ) => new BootstrapAdminUseCase(users, passwordHasher),
      inject: [PrismaUserRepository, Argon2PasswordHasher],
    },
    {
      provide: SignInUseCase,
      useFactory: (
        users: PrismaUserRepository,
        sessions: PrismaSessionRepository,
        passwordHasher: Argon2PasswordHasher,
        tokens: JwtTokenService,
        audit: StructuredAuthEventLogger,
      ) => new SignInUseCase(users, sessions, passwordHasher, tokens, audit),
      inject: [
        PrismaUserRepository,
        PrismaSessionRepository,
        Argon2PasswordHasher,
        JwtTokenService,
        StructuredAuthEventLogger,
      ],
    },
    {
      provide: RefreshTokensUseCase,
      useFactory: (
        users: PrismaUserRepository,
        sessions: PrismaSessionRepository,
        tokens: JwtTokenService,
        audit: StructuredAuthEventLogger,
      ) => new RefreshTokensUseCase(users, sessions, tokens, audit),
      inject: [
        PrismaUserRepository,
        PrismaSessionRepository,
        JwtTokenService,
        StructuredAuthEventLogger,
      ],
    },
    {
      provide: ValidateAccessTokenUseCase,
      useFactory: (
        users: PrismaUserRepository,
        sessions: PrismaSessionRepository,
        tokens: JwtTokenService,
        audit: StructuredAuthEventLogger,
      ) => new ValidateAccessTokenUseCase(users, sessions, tokens, audit),
      inject: [
        PrismaUserRepository,
        PrismaSessionRepository,
        JwtTokenService,
        StructuredAuthEventLogger,
      ],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (users: PrismaUserRepository) =>
        new GetCurrentUserUseCase(users),
      inject: [PrismaUserRepository],
    },
    {
      provide: SignOutUseCase,
      useFactory: (
        sessions: PrismaSessionRepository,
        audit: StructuredAuthEventLogger,
      ) => new SignOutUseCase(sessions, audit),
      inject: [PrismaSessionRepository, StructuredAuthEventLogger],
    },
  ],
  exports: [JwtAuthGuard, ValidateAccessTokenUseCase],
})
export class AuthModule {}
