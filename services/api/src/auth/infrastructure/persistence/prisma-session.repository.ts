import { Injectable } from '@nestjs/common';
import {
  AuthSessionRecord,
  CreateSessionInput,
  RotateSessionInput,
  SessionRepository,
} from '@/auth/application/ports/auth.ports';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<AuthSessionRecord> {
    const session = await this.prisma.authSession.create({ data: input });
    return this.toRecord(session);
  }

  async findByRefreshTokenHash(
    hash: string,
  ): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.authSession.findUnique({
      where: { refreshTokenHash: hash },
    });
    return session ? this.toRecord(session) : null;
  }

  async findByAccessTokenIdHash(
    hash: string,
  ): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.authSession.findUnique({
      where: { accessTokenIdHash: hash },
    });
    return session ? this.toRecord(session) : null;
  }

  async rotate(input: RotateSessionInput): Promise<AuthSessionRecord> {
    const session = await this.prisma.authSession.update({
      where: { id: input.sessionId },
      data: {
        accessTokenIdHash: input.accessTokenIdHash,
        refreshTokenHash: input.refreshTokenHash,
        issuedAt: input.issuedAt,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        rotatedAt: input.issuedAt,
        lastUsedAt: input.issuedAt,
      },
    });
    return this.toRecord(session);
  }

  async revokeById(sessionId: string, revokedAt: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async touch(sessionId: string, usedAt: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { lastUsedAt: usedAt },
    });
  }

  private toRecord(session: {
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
  }): AuthSessionRecord {
    return {
      id: session.id,
      userId: session.userId,
      accessTokenIdHash: session.accessTokenIdHash,
      refreshTokenHash: session.refreshTokenHash,
      issuedAt: session.issuedAt,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      revokedAt: session.revokedAt,
      lastUsedAt: session.lastUsedAt,
      rotatedAt: session.rotatedAt,
    };
  }
}
