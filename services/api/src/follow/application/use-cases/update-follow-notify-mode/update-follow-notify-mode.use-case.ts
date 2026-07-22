import { FollowRepository } from '@/follow/application/ports/follow.ports';
import {
  parseFollowNotifyMode,
  parseFollowObjectType,
} from '@/follow/application/use-cases/follow-input';
import {
  UpdateFollowNotifyModeInput,
  UpdateFollowNotifyModeOutput,
} from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.dto';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';

export class UpdateFollowNotifyModeUseCase {
  constructor(private readonly follows: FollowRepository) {}

  async execute(
    input: UpdateFollowNotifyModeInput,
  ): Promise<UpdateFollowNotifyModeOutput> {
    const objectType = parseFollowObjectType(input.objectType);
    const objectId = input.objectId as string;
    const notifyMode = parseFollowNotifyMode(input.notifyMode);
    const follow = await this.follows.updateNotifyMode({
      userId: input.userId,
      objectType,
      objectId,
      notifyMode,
    });

    if (!follow) {
      throw new FollowUseCaseError(
        FollowFailureReason.FollowMissing,
        'Follow not found',
      );
    }

    return {
      followId: follow.id,
      objectType: follow.objectType,
      objectId: follow.objectId,
      notifyMode: follow.notifyMode,
      followedAt: follow.createdAt,
    };
  }
}
