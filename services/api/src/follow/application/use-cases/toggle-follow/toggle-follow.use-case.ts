import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { FollowRepository } from '@/follow/application/ports/follow.ports';
import {
  parseFollowObjectId,
  parseFollowObjectType,
  parseOptionalFollowNotifyMode,
} from '@/follow/application/use-cases/follow-input';
import {
  ToggleFollowInput,
  ToggleFollowOutput,
} from '@/follow/application/use-cases/toggle-follow/toggle-follow.dto';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';

export class ToggleFollowUseCase {
  constructor(
    private readonly follows: FollowRepository,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(input: ToggleFollowInput): Promise<ToggleFollowOutput> {
    const objectType = parseFollowObjectType(input.objectType);
    const objectId = parseFollowObjectId(input.objectId);
    const notifyMode = parseOptionalFollowNotifyMode(input.notifyMode);
    const existing = await this.follows.findByUserAndTarget({
      userId: input.userId,
      objectType,
      objectId,
    });

    if (existing) {
      await this.follows.deleteByUserAndTarget({
        userId: input.userId,
        objectType,
        objectId,
      });
      return { objectType, objectId, followed: false };
    }

    const existingIds = await this.graph.findExistingReferenceIds(objectType, [
      objectId,
    ]);
    if (!existingIds.has(objectId)) {
      throw new FollowUseCaseError(
        FollowFailureReason.TargetMissing,
        'Follow target not found',
      );
    }

    const created = await this.follows.create({
      userId: input.userId,
      objectType,
      objectId,
      notifyMode,
    });

    return {
      objectType,
      objectId,
      followed: true,
      notifyMode: created.notifyMode,
      followedAt: created.createdAt,
    };
  }
}
