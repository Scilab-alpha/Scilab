import { Injectable } from '@nestjs/common';
import { UserFollow } from '@prisma/client';
import { FollowTargetReference } from '@repo/academic/domain';
import {
  FollowNotifyMode,
  FollowObjectType,
  FollowRecipient,
  FollowRecord,
  FollowRepository,
} from '@/follow/application/ports/follow.ports';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaFollowRepository implements FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  countByUser(userId: string): Promise<number> {
    return this.prisma.userFollow.count({ where: { userId } });
  }

  async findByUserAndTarget(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
  }): Promise<FollowRecord | null> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        userId_objectType_objectId: {
          userId: input.userId,
          objectType: input.objectType,
          objectId: input.objectId,
        },
      },
    });

    return follow ? this.toRecord(follow) : null;
  }

  async create(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
    notifyMode: FollowNotifyMode;
  }): Promise<FollowRecord> {
    const follow = await this.prisma.userFollow.create({
      data: {
        userId: input.userId,
        objectType: input.objectType,
        objectId: input.objectId,
        notifyMode: input.notifyMode,
      },
    });

    return this.toRecord(follow);
  }

  async deleteByUserAndTarget(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
  }): Promise<boolean> {
    const result = await this.prisma.userFollow.deleteMany({
      where: {
        userId: input.userId,
        objectType: input.objectType,
        objectId: input.objectId,
      },
    });

    return result.count > 0;
  }

  async updateNotifyMode(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
    notifyMode: FollowNotifyMode;
  }): Promise<FollowRecord | null> {
    const result = await this.prisma.userFollow.updateManyAndReturn({
      where: {
        userId: input.userId,
        objectType: input.objectType,
        objectId: input.objectId,
      },
      data: { notifyMode: input.notifyMode },
    });

    return result[0] ? this.toRecord(result[0]) : null;
  }

  async listByUser(input: {
    userId: string;
    objectType?: FollowObjectType;
    skip: number;
    take: number;
  }): Promise<FollowRecord[]> {
    const follows = await this.prisma.userFollow.findMany({
      where: {
        userId: input.userId,
        objectType: input.objectType,
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: input.skip,
      take: input.take,
    });

    return follows.map((follow) => this.toRecord(follow));
  }

  async listDistinctReferences(
    modes?: FollowNotifyMode[],
  ): Promise<FollowTargetReference[]> {
    const rows = await this.prisma.userFollow.findMany({
      where: modes ? { notifyMode: { in: modes } } : undefined,
      distinct: ['objectType', 'objectId'],
      select: { objectType: true, objectId: true },
    });

    return rows.map((row) => ({
      type: String(row.objectType) as FollowObjectType,
      id: row.objectId,
    }));
  }

  async listRecipientsForReferences(
    refs: FollowTargetReference[],
    modes?: FollowNotifyMode[],
  ): Promise<FollowRecipient[]> {
    if (refs.length === 0) {
      return [];
    }

    const rows = await this.prisma.userFollow.findMany({
      where: {
        OR: refs.map((ref) => ({
          objectType: ref.type,
          objectId: ref.id,
        })),
        notifyMode: modes ? { in: modes } : undefined,
      },
      select: {
        userId: true,
        objectType: true,
        objectId: true,
        notifyMode: true,
      },
    });

    return rows.map((row) => ({
      userId: row.userId,
      objectType: String(row.objectType) as FollowObjectType,
      objectId: row.objectId,
      notifyMode: String(row.notifyMode) as FollowNotifyMode,
    }));
  }

  async deleteByReferences(refs: FollowTargetReference[]): Promise<number> {
    if (refs.length === 0) {
      return 0;
    }

    const result = await this.prisma.userFollow.deleteMany({
      where: {
        OR: refs.map((ref) => ({
          objectType: ref.type,
          objectId: ref.id,
        })),
      },
    });

    return result.count;
  }

  private toRecord(follow: UserFollow): FollowRecord {
    return {
      id: follow.id,
      userId: follow.userId,
      objectType: String(follow.objectType) as FollowObjectType,
      objectId: follow.objectId,
      notifyMode: String(follow.notifyMode) as FollowNotifyMode,
      createdAt: follow.createdAt,
    };
  }
}
