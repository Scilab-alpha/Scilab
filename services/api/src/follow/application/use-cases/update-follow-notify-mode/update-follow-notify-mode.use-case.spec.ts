import {
  FollowRecord,
  FollowRepository,
} from '@/follow/application/ports/follow.ports';
import { UpdateFollowNotifyModeUseCase } from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.use-case';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';

function createFollowRepository(): jest.Mocked<FollowRepository> {
  return {
    countByUser: jest.fn(),
    findByUserAndTarget: jest.fn(),
    create: jest.fn(),
    deleteByUserAndTarget: jest.fn(),
    updateNotifyMode: jest.fn(),
    listByUser: jest.fn(),
    listDistinctReferences: jest.fn(),
    listRecipientsForReferences: jest.fn(),
    deleteByReferences: jest.fn(),
  };
}

describe('UpdateFollowNotifyModeUseCase', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-21T00:00:00.000Z');

  it('updates notify mode for an academic string object id', async () => {
    const follows = createFollowRepository();
    const useCase = new UpdateFollowNotifyModeUseCase(follows);
    const updated: FollowRecord = {
      id: 'follow-1',
      userId,
      objectType: 'KEYWORD',
      objectId: 'deep-learning',
      notifyMode: 'WEEKLY_EMAIL',
      createdAt,
    };

    follows.updateNotifyMode.mockResolvedValue(updated);

    await expect(
      useCase.execute({
        userId,
        objectType: 'KEYWORD',
        objectId: ' deep-learning ',
        notifyMode: 'WEEKLY_EMAIL',
      }),
    ).resolves.toEqual({
      followId: 'follow-1',
      objectType: 'KEYWORD',
      objectId: 'deep-learning',
      notifyMode: 'WEEKLY_EMAIL',
      followedAt: createdAt,
    });
    expect(follows.updateNotifyMode.mock.calls).toEqual([
      [
        {
          userId,
          objectType: 'KEYWORD',
          objectId: 'deep-learning',
          notifyMode: 'WEEKLY_EMAIL',
        },
      ],
    ]);
  });

  it('rejects invalid object id before persistence', async () => {
    const follows = createFollowRepository();
    const useCase = new UpdateFollowNotifyModeUseCase(follows);

    await expect(
      useCase.execute({
        userId,
        objectType: 'KEYWORD',
        objectId: '',
        notifyMode: 'IN_APP',
      }),
    ).rejects.toMatchObject({
      reason: FollowFailureReason.InvalidInput,
      message: 'objectId is required',
    } satisfies Partial<FollowUseCaseError>);
    expect(follows.updateNotifyMode.mock.calls).toHaveLength(0);
  });
});
