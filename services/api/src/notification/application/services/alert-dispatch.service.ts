import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ACADEMIC_GRAPH_REPOSITORY } from '@repo/academic/domain';
import type {
  AcademicGraphRepository,
  FollowTargetReference,
} from '@repo/academic/domain';
import { toArticleGraphOutput } from '@repo/academic/domain';
import type {
  FollowNotifyMode,
  FollowRecipient,
} from '@/follow/application/ports/follow.ports';
import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';
import { UserEventsService } from '@/events/application/user-events.service';
import { toNotificationOutput } from '@/notification/application/use-cases/notification.mapper';
import { NoopEmailDigestPort } from '@/notification/infrastructure/email/noop-email-digest.port';
import { PrismaNotificationRepository } from '@/notification/infrastructure/persistence/prisma-notification.repository';
import { PushNotificationDispatcher } from '@/push/application/services/push-notification.dispatcher';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_MODES: FollowNotifyMode[] = ['IN_APP', 'DAILY_EMAIL'];
const WEEKLY_MODES: FollowNotifyMode[] = ['WEEKLY_EMAIL'];

@Injectable()
export class AlertDispatchService {
  private readonly logger = new Logger(AlertDispatchService.name);

  constructor(
    private readonly follows: PrismaFollowRepository,
    private readonly notifications: PrismaNotificationRepository,
    private readonly emailDigest: NoopEmailDigestPort,
    private readonly events: UserEventsService,
    private readonly push: PushNotificationDispatcher,
    @Inject(ACADEMIC_GRAPH_REPOSITORY)
    private readonly graph: AcademicGraphRepository,
  ) {}

  @Cron('0 0 * * *', { timeZone: 'UTC' })
  async dispatchDaily() {
    await this.dispatchSince(new Date(Date.now() - ONE_DAY_MS), DAILY_MODES);
  }

  @Cron('0 0 * * 1', { timeZone: 'UTC' })
  async dispatchWeekly() {
    await this.dispatchSince(
      new Date(Date.now() - 7 * ONE_DAY_MS),
      WEEKLY_MODES,
    );
  }

  async dispatchSince(
    since: Date,
    modes: FollowNotifyMode[],
  ): Promise<{ createdCount: number }> {
    const refs = await this.follows.listDistinctReferences(modes);
    const groups = groupReferences(refs);
    const matchedArticles =
      await this.graph.findArticlesMatchingFollowedTargets(groups, since);
    const allMatches = uniqueReferences(
      matchedArticles.flatMap((match) => match.matches),
    );
    const recipients = await this.follows.listRecipientsForReferences(
      allMatches,
      modes,
    );
    const recipientsByRef = groupRecipients(recipients);
    let createdCount = 0;

    for (const match of matchedArticles) {
      const article = toArticleGraphOutput(match.article);
      const recipientsForArticle = new Map<string, ArticleRecipient>();

      for (const ref of match.matches) {
        for (const recipient of recipientsByRef.get(refKey(ref)) ?? []) {
          const current = recipientsForArticle.get(recipient.userId) ?? {
            userId: recipient.userId,
            sendEmail: false,
          };
          recipientsForArticle.set(recipient.userId, {
            userId: recipient.userId,
            sendEmail: current.sendEmail || isEmailMode(recipient.notifyMode),
          });
        }
      }

      for (const recipient of recipientsForArticle.values()) {
        const created = await this.notifications.createForArticleIfNotExists({
          userId: recipient.userId,
          articleId: article.id,
          title: 'New article from your follows',
          message: article.title,
        });

        if (created) {
          createdCount += 1;
          this.events.emit(
            recipient.userId,
            'notification.created',
            toNotificationOutput(created),
          );
          await this.push.sendToUser(recipient.userId, {
            title: created.title,
            body: created.message,
            data: {
              notificationId: created.id,
              relatedObjectType: created.relatedObjectType ?? '',
              relatedObjectId: created.relatedObjectId ?? '',
            },
          });
        }

        if (recipient.sendEmail) {
          await this.emailDigest.send({
            userId: recipient.userId,
            subject: 'SciLab followed article update',
            body: article.title,
          });
        }
      }
    }

    this.logger.log(
      JSON.stringify({
        type: 'ALERT_DISPATCH_COMPLETED',
        matchedArticles: matchedArticles.length,
        createdCount,
      }),
    );

    return { createdCount };
  }
}

interface ArticleRecipient {
  userId: string;
  sendEmail: boolean;
}

function isEmailMode(mode: FollowNotifyMode): boolean {
  return mode === 'DAILY_EMAIL' || mode === 'WEEKLY_EMAIL';
}

function groupReferences(refs: FollowTargetReference[]) {
  return {
    authors: refs.filter((ref) => ref.type === 'AUTHOR').map((ref) => ref.id),
    journals: refs.filter((ref) => ref.type === 'JOURNAL').map((ref) => ref.id),
    keywords: refs.filter((ref) => ref.type === 'KEYWORD').map((ref) => ref.id),
    topics: refs.filter((ref) => ref.type === 'TOPIC').map((ref) => ref.id),
  };
}

function uniqueReferences(
  refs: FollowTargetReference[],
): FollowTargetReference[] {
  const byKey = new Map<string, FollowTargetReference>();
  for (const ref of refs) {
    byKey.set(refKey(ref), ref);
  }
  return [...byKey.values()];
}

function groupRecipients(recipients: FollowRecipient[]) {
  const groups = new Map<string, FollowRecipient[]>();

  for (const recipient of recipients) {
    const key = refKey({
      type: recipient.objectType,
      id: recipient.objectId,
    });
    groups.set(key, [...(groups.get(key) ?? []), recipient]);
  }

  return groups;
}

function refKey(ref: FollowTargetReference): string {
  return `${ref.type}:${ref.id}`;
}
