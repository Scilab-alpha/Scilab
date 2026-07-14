/* eslint-disable @typescript-eslint/unbound-method */
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { FollowRecipient } from '@/follow/application/ports/follow.ports';
import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';
import { UserEventsService } from '@/events/application/user-events.service';
import { AlertDispatchService } from '@/notification/application/services/alert-dispatch.service';
import { NoopEmailDigestPort } from '@/notification/infrastructure/email/noop-email-digest.port';
import { PrismaNotificationRepository } from '@/notification/infrastructure/persistence/prisma-notification.repository';
import { PushNotificationDispatcher } from '@/push/application/services/push-notification.dispatcher';

const userId = '11111111-1111-4111-8111-111111111111';
const journalId = '22222222-2222-4222-8222-222222222222';
const topicId = '33333333-3333-4333-8333-333333333333';
const articleId = '44444444-4444-4444-8444-444444444444';
const since = new Date('2026-04-01T00:00:00.000Z');

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
    listPlaceholderArticleIds: jest.fn(),
    listHydratedArticleIdsForIncomingCitation: jest.fn(),
    markIncomingCitationCrawled: jest.fn(),
    listHydratedArticleIdsNeedingCitation: jest.fn(),
    updateArticleCitationCounts: jest.fn(),
  };
}

describe('AlertDispatchService', () => {
  it('groups follow refs, creates in-app notifications, and sends email digests', async () => {
    const follows = {
      listDistinctReferences: jest.fn().mockResolvedValue([
        { type: 'JOURNAL', id: journalId },
        { type: 'TOPIC', id: topicId },
      ]),
      listRecipientsForReferences: jest.fn().mockResolvedValue([
        {
          userId,
          objectType: 'JOURNAL',
          objectId: journalId,
          notifyMode: 'DAILY_EMAIL',
        } satisfies FollowRecipient,
      ]),
    } as unknown as jest.Mocked<PrismaFollowRepository>;
    const notifications = {
      createForArticleIfNotExists: jest.fn().mockResolvedValue({
        id: 'notification-1',
        userId,
        title: 'New article from your follows',
        message: 'New journal article',
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        relatedObjectType: 'ARTICLE',
        relatedObjectId: articleId,
      }),
    } as unknown as jest.Mocked<PrismaNotificationRepository>;
    const emailDigest = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NoopEmailDigestPort>;
    const events = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<UserEventsService>;
    const push = {
      sendToUser: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PushNotificationDispatcher>;
    const graph = createGraphRepository();
    graph.findArticlesMatchingFollowedTargets.mockResolvedValue([
      {
        article: {
          article: {
            id: articleId,
            title: 'New journal article',
            createdAt: new Date('2026-04-02T00:00:00.000Z'),
          },
        },
        matches: [{ type: 'JOURNAL', id: journalId }],
      },
    ]);

    const result = await new AlertDispatchService(
      follows,
      notifications,
      emailDigest,
      events,
      push,
      graph,
    ).dispatchSince(since, ['IN_APP', 'DAILY_EMAIL']);

    expect(result).toEqual({ createdCount: 1 });
    expect(follows.listDistinctReferences).toHaveBeenCalledWith([
      'IN_APP',
      'DAILY_EMAIL',
    ]);
    expect(graph.findArticlesMatchingFollowedTargets).toHaveBeenCalledWith(
      {
        journals: [journalId],
        keywords: [],
        topics: [topicId],
      },
      since,
    );
    expect(notifications.createForArticleIfNotExists).toHaveBeenCalledWith({
      userId,
      articleId,
      title: 'New article from your follows',
      message: 'New journal article',
    });
    expect(emailDigest.send).toHaveBeenCalledWith({
      userId,
      subject: 'SciLab followed article update',
      body: 'New journal article',
    });
    expect(events.emit).toHaveBeenCalledWith(
      userId,
      'notification.created',
      expect.objectContaining({ notificationId: 'notification-1' }),
    );
    expect(push.sendToUser).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        title: 'New article from your follows',
        body: 'New journal article',
      }),
    );
  });

  it('dedupes recipients per article and sends email when any matched follow requests it', async () => {
    const follows = {
      listDistinctReferences: jest.fn().mockResolvedValue([
        { type: 'JOURNAL', id: journalId },
        { type: 'TOPIC', id: topicId },
      ]),
      listRecipientsForReferences: jest.fn().mockResolvedValue([
        {
          userId,
          objectType: 'JOURNAL',
          objectId: journalId,
          notifyMode: 'IN_APP',
        },
        {
          userId,
          objectType: 'TOPIC',
          objectId: topicId,
          notifyMode: 'DAILY_EMAIL',
        },
      ]),
    } as unknown as jest.Mocked<PrismaFollowRepository>;
    const notifications = {
      createForArticleIfNotExists: jest.fn().mockResolvedValue({
        id: 'notification-2',
        userId,
        title: 'New article from your follows',
        message: 'Multi match article',
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        relatedObjectType: 'ARTICLE',
        relatedObjectId: articleId,
      }),
    } as unknown as jest.Mocked<PrismaNotificationRepository>;
    const emailDigest = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NoopEmailDigestPort>;
    const events = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<UserEventsService>;
    const push = {
      sendToUser: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PushNotificationDispatcher>;
    const graph = createGraphRepository();
    graph.findArticlesMatchingFollowedTargets.mockResolvedValue([
      {
        article: {
          article: { id: articleId, title: 'Multi match article' },
        },
        matches: [
          { type: 'JOURNAL', id: journalId },
          { type: 'TOPIC', id: topicId },
        ],
      },
    ]);

    const result = await new AlertDispatchService(
      follows,
      notifications,
      emailDigest,
      events,
      push,
      graph,
    ).dispatchSince(since, ['IN_APP', 'DAILY_EMAIL']);

    expect(result).toEqual({ createdCount: 1 });
    expect(notifications.createForArticleIfNotExists).toHaveBeenCalledTimes(1);
    expect(emailDigest.send).toHaveBeenCalledTimes(1);
    expect(push.sendToUser).toHaveBeenCalledTimes(1);
  });
});
