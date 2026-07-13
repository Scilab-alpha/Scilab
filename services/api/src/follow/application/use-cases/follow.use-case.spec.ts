/* eslint-disable @typescript-eslint/unbound-method */
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { FollowRepository } from '@/follow/application/ports/follow.ports';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { ToggleFollowUseCase } from '@/follow/application/use-cases/toggle-follow/toggle-follow.use-case';
import { UpdateFollowNotifyModeUseCase } from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.use-case';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';

const userId = '11111111-1111-4111-8111-111111111111';
const journalId = '22222222-2222-4222-8222-222222222222';
const topicId = '33333333-3333-4333-8333-333333333333';
const followedAt = new Date('2026-02-01T00:00:00.000Z');

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

function createGraphRepository(): jest.Mocked<AcademicGraphRepository> {
  return {
    ensureSchema: jest.fn(),
    upsertArticleGraph: jest.fn(),
    listArticles: jest.fn(),
    getArticleById: jest.fn(),
    listAuthors: jest.fn(),
    getAuthorById: jest.fn(),
    listJournals: jest.fn(),
    getJournalById: jest.fn(),
    findArticlesByIds: jest.fn(),
    findFollowTargetsByReferences: jest.fn(),
    findArticlesMatchingFollowedTargets: jest.fn(),
    findExistingReferenceIds: jest.fn(),
    backfillHydrationStateAndRemoveRegion: jest.fn(),
    listJournalsForPublisherNormalization: jest.fn(),
    updatePublisherNameNormalizations: jest.fn(),
    listHydratedArticleIdsMissingCitation: jest.fn(),
    updateArticleCitationCounts: jest.fn(),
  };
}

describe('Follow use cases', () => {
  it('toggles a missing follow on with default IN_APP notify mode', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    follows.findByUserAndTarget.mockResolvedValue(null);
    graph.findExistingReferenceIds.mockResolvedValue(new Set([journalId]));
    follows.create.mockResolvedValue({
      id: 'follow-1',
      userId,
      objectType: 'JOURNAL',
      objectId: journalId,
      notifyMode: 'IN_APP',
      createdAt: followedAt,
    });

    const result = await new ToggleFollowUseCase(follows, graph).execute({
      userId,
      objectType: 'JOURNAL',
      objectId: journalId,
    });

    expect(result).toEqual({
      objectType: 'JOURNAL',
      objectId: journalId,
      followed: true,
      notifyMode: 'IN_APP',
      followedAt,
    });
    expect(follows.create).toHaveBeenCalledWith({
      userId,
      objectType: 'JOURNAL',
      objectId: journalId,
      notifyMode: 'IN_APP',
    });
  });

  it('toggles an existing follow off', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    follows.findByUserAndTarget.mockResolvedValue({
      id: 'follow-1',
      userId,
      objectType: 'JOURNAL',
      objectId: journalId,
      notifyMode: 'DAILY_EMAIL',
      createdAt: followedAt,
    });
    follows.deleteByUserAndTarget.mockResolvedValue(true);

    await expect(
      new ToggleFollowUseCase(follows, graph).execute({
        userId,
        objectType: 'JOURNAL',
        objectId: journalId,
      }),
    ).resolves.toEqual({
      objectType: 'JOURNAL',
      objectId: journalId,
      followed: false,
    });
    expect(graph.findExistingReferenceIds).not.toHaveBeenCalled();
  });

  it('rejects invalid input and missing targets', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    follows.findByUserAndTarget.mockResolvedValue(null);
    graph.findExistingReferenceIds.mockResolvedValue(new Set());
    const useCase = new ToggleFollowUseCase(follows, graph);

    await expect(
      useCase.execute({ userId, objectType: 'AUTHOR', objectId: journalId }),
    ).rejects.toMatchObject({
      reason: FollowFailureReason.InvalidInput,
    } satisfies Partial<FollowUseCaseError>);
    await expect(
      useCase.execute({ userId, objectType: 'JOURNAL', objectId: journalId }),
    ).rejects.toMatchObject({
      reason: FollowFailureReason.TargetMissing,
    } satisfies Partial<FollowUseCaseError>);
  });

  it('updates notify mode only for an existing follow', async () => {
    const follows = createFollowRepository();
    follows.updateNotifyMode.mockResolvedValue({
      id: 'follow-1',
      userId,
      objectType: 'TOPIC',
      objectId: topicId,
      notifyMode: 'OFF',
      createdAt: followedAt,
    });

    await expect(
      new UpdateFollowNotifyModeUseCase(follows).execute({
        userId,
        objectType: 'TOPIC',
        objectId: topicId,
        notifyMode: 'OFF',
      }),
    ).resolves.toMatchObject({
      followId: 'follow-1',
      objectType: 'TOPIC',
      objectId: topicId,
      notifyMode: 'OFF',
    });

    follows.updateNotifyMode.mockResolvedValueOnce(null);
    await expect(
      new UpdateFollowNotifyModeUseCase(follows).execute({
        userId,
        objectType: 'TOPIC',
        objectId: topicId,
        notifyMode: 'IN_APP',
      }),
    ).rejects.toMatchObject({ reason: FollowFailureReason.FollowMissing });
  });

  it('lists follows by type and skips Neo4j orphans', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();
    follows.listByUser.mockResolvedValue([
      {
        id: 'follow-1',
        userId,
        objectType: 'JOURNAL',
        objectId: journalId,
        notifyMode: 'IN_APP',
        createdAt: followedAt,
      },
      {
        id: 'follow-2',
        userId,
        objectType: 'TOPIC',
        objectId: topicId,
        notifyMode: 'WEEKLY_EMAIL',
        createdAt: followedAt,
      },
    ]);
    graph.findFollowTargetsByReferences.mockResolvedValue([
      {
        type: 'JOURNAL',
        id: journalId,
        displayName: 'Journal of Data',
        country: 'US',
      },
    ]);

    const result = await new ListFollowsUseCase(follows, graph).execute({
      userId,
      type: 'JOURNAL',
      page: '1',
      limit: '20',
    });

    expect(follows.listByUser).toHaveBeenCalledWith({
      userId,
      objectType: 'JOURNAL',
      skip: 0,
      take: 21,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      followId: 'follow-1',
      objectType: 'JOURNAL',
      objectId: journalId,
      target: { id: journalId, displayName: 'Journal of Data' },
    });
  });

  it('rejects invalid pagination instead of silently defaulting', async () => {
    const follows = createFollowRepository();
    const graph = createGraphRepository();

    await expect(
      new ListFollowsUseCase(follows, graph).execute({
        userId,
        page: '1',
        limit: '101',
      }),
    ).rejects.toMatchObject({
      reason: FollowFailureReason.InvalidInput,
    } satisfies Partial<FollowUseCaseError>);
    expect(follows.listByUser).not.toHaveBeenCalled();
  });
});
