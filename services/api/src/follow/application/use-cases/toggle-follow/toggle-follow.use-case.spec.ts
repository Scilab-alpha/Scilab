import { AcademicGraphRepository } from '@repo/academic/domain';
import {
  FollowRecord,
  FollowRepository,
} from '@/follow/application/ports/follow.ports';
import { ToggleFollowUseCase } from '@/follow/application/use-cases/toggle-follow/toggle-follow.use-case';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';

function createFollowRepository(): jest.Mocked<FollowRepository> {
  return {
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

function createGraphRepository(): jest.Mocked<
  Pick<AcademicGraphRepository, 'findExistingReferenceIds'>
> {
  return {
    findExistingReferenceIds: jest.fn(),
  };
}

describe('ToggleFollowUseCase', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-21T00:00:00.000Z');

  it('follows an academic string object id', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    const useCase = new ToggleFollowUseCase(
      follows,
      graph as unknown as AcademicGraphRepository,
    );
    const created: FollowRecord = {
      id: 'follow-1',
      userId,
      objectType: 'JOURNAL',
      objectId: 'S123456789',
      notifyMode: 'IN_APP',
      createdAt,
    };

    follows.findByUserAndTarget.mockResolvedValue(null);
    graph.findExistingReferenceIds.mockResolvedValue(new Set(['S123456789']));
    follows.create.mockResolvedValue(created);

    await expect(
      useCase.execute({
        userId,
        objectType: 'JOURNAL',
        objectId: '  S123456789  ',
        notifyMode: 'IN_APP',
      }),
    ).resolves.toEqual({
      objectType: 'JOURNAL',
      objectId: 'S123456789',
      followed: true,
      notifyMode: 'IN_APP',
      followedAt: createdAt,
    });
    expect(follows.findByUserAndTarget.mock.calls).toEqual([
      [
        {
          userId,
          objectType: 'JOURNAL',
          objectId: 'S123456789',
        },
      ],
    ]);
    expect(follows.create.mock.calls).toEqual([
      [
        {
          userId,
          objectType: 'JOURNAL',
          objectId: 'S123456789',
          notifyMode: 'IN_APP',
        },
      ],
    ]);
  });

  it('rejects missing object id as invalid input before persistence', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    const useCase = new ToggleFollowUseCase(
      follows,
      graph as unknown as AcademicGraphRepository,
    );

    await expect(
      useCase.execute({
        userId,
        objectType: 'JOURNAL',
        objectId: ' ',
      }),
    ).rejects.toMatchObject({
      reason: FollowFailureReason.InvalidInput,
      message: 'objectId is required',
    } satisfies Partial<FollowUseCaseError>);
    expect(follows.findByUserAndTarget.mock.calls).toHaveLength(0);
    expect(graph.findExistingReferenceIds.mock.calls).toHaveLength(0);
  });

  it('unfollows an existing academic string object id', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    const useCase = new ToggleFollowUseCase(
      follows,
      graph as unknown as AcademicGraphRepository,
    );
    const existing: FollowRecord = {
      id: 'follow-1',
      userId,
      objectType: 'TOPIC',
      objectId: 'topic-machine-learning',
      notifyMode: 'DAILY_EMAIL',
      createdAt,
    };

    follows.findByUserAndTarget.mockResolvedValue(existing);
    follows.deleteByUserAndTarget.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId,
        objectType: 'TOPIC',
        objectId: 'topic-machine-learning',
      }),
    ).resolves.toEqual({
      objectType: 'TOPIC',
      objectId: 'topic-machine-learning',
      followed: false,
    });
    expect(graph.findExistingReferenceIds.mock.calls).toHaveLength(0);
  });
});
