/*
 * The Neo4j driver exposes property maps as dynamic values. This application
 * boundary normalizes those maps before returning API DTOs, so the unsafe-value
 * rules are intentionally contained in this one adapter-facing service.
 */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AcademicJobAuditAction,
  AcademicJobAuditOutcome,
  AcademicJobRunStatus,
  AcademicJobRunTrigger,
  SyncSource,
  SyncStatus,
} from '@prisma/client';
import {
  ACADEMIC_PIPELINE_JOB_DEFINITIONS,
  ACADEMIC_PIPELINE_QUEUE_NAMES,
  AcademicPipelineQueueName,
  AcademicPipelineQueueProducer,
  AcademicPipelineTrigger,
} from '@repo/academic-queue';
import { PrismaService } from '@repo/database';
import { Neo4jService } from '@repo/neo4j';
import { parseExpression } from 'cron-parser';
import neo4j from 'neo4j-driver';

export interface AdminActor {
  userId: string;
  email: string;
}

export interface AdminPageInput {
  page: number;
  pageSize: number;
}

export interface AdminDateRangeInput {
  firstCrawledFrom?: string | null;
  firstCrawledTo?: string | null;
  lastSyncedFrom?: string | null;
  lastSyncedTo?: string | null;
}

type JobAction = 'pause' | 'resume' | 'trigger' | 'cancel' | 'retry';

const DASHBOARD_TOP_LIMIT = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const EMPTY_DASHBOARD_GRAPH = {
  articleCount: 0,
  journalCount: 0,
  authorCount: 0,
  growth: {
    last7Days: { articles: 0, journals: 0, authorsWithNewArticles: 0 },
    last30Days: { articles: 0, journals: 0, authorsWithNewArticles: 0 },
  },
  rankings: { topJournals: [], topArticles: [] },
  dataQuality: {
    hydratedArticles: 0,
    placeholderArticles: 0,
    missingDoi: 0,
    missingAbstract: 0,
    missingAuthors: 0,
  },
};

@Injectable()
export class AdminAcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly neo4j: Neo4jService,
    private readonly queues: AcademicPipelineQueueProducer,
  ) {}

  async getDashboardMetrics() {
    const generatedAt = new Date();
    const last24Hours = new Date(generatedAt.getTime() - DAY_IN_MS);
    const last7Days = new Date(generatedAt.getTime() - DAY_IN_MS * 7);
    const last30Days = new Date(generatedAt.getTime() - DAY_IN_MS * 30);

    try {
      const [database, graph] = await Promise.all([
        this.loadDashboardDatabaseMetrics(last24Hours, last7Days, last30Days),
        this.loadDashboardGraphMetrics(last7Days, last30Days),
      ]);

      return {
        generatedAt: generatedAt.toISOString(),
        articleCount: graph.articleCount,
        journalCount: graph.journalCount,
        authorCount: graph.authorCount,
        userCount: database.userCount,
        summary: {
          articleCount: graph.articleCount,
          journalCount: graph.journalCount,
          authorCount: graph.authorCount,
          userCount: database.userCount,
        },
        users: database.users,
        engagement: database.engagement,
        sync: database.sync,
        growth: graph.growth,
        rankings: graph.rankings,
        dataQuality: graph.dataQuality,
        sources: database.sources,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Dashboard metrics are unavailable',
      );
    }
  }

  private async loadDashboardDatabaseMetrics(
    last24Hours: Date,
    last7Days: Date,
    last30Days: Date,
  ) {
    const [
      userCount,
      usersByStatus,
      usersByRole,
      newUsersLast7Days,
      newUsersLast30Days,
      bookmarkCount,
      followCount,
      unreadNotificationCount,
      runningJobCount,
      failedSyncCount,
      recentSyncLogs,
      sourceConfigs,
      failuresByConfig,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.userBookmark.count(),
      this.prisma.userFollow.count(),
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.academicJobRun.count({
        where: { status: AcademicJobRunStatus.RUNNING },
      }),
      this.prisma.syncLog.count({
        where: { status: SyncStatus.FAILED, startedAt: { gte: last24Hours } },
      }),
      this.prisma.syncLog.findMany({
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take: 5,
        include: { config: { select: { apiName: true } } },
      }),
      this.prisma.systemConfig.findMany({
        select: {
          id: true,
          apiName: true,
          isActive: true,
          lastTestedAt: true,
          syncLogs: {
            orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { status: true, startedAt: true },
          },
        },
      }),
      this.prisma.syncLog.groupBy({
        by: ['configId'],
        where: { status: SyncStatus.FAILED, startedAt: { gte: last24Hours } },
        _count: { _all: true },
      }),
    ]);

    const byStatus = { active: 0, inactive: 0, banned: 0 };
    for (const row of usersByStatus) {
      const key = String(row.status).toLowerCase() as keyof typeof byStatus;
      if (key in byStatus) byStatus[key] = row._count._all;
    }
    const byRole = { student: 0, researcher: 0, admin: 0 };
    for (const row of usersByRole) {
      const key = String(row.role).toLowerCase() as keyof typeof byRole;
      if (key in byRole) byRole[key] = row._count._all;
    }
    const failedByConfig = new Map(
      failuresByConfig.map((row) => [row.configId, row._count._all]),
    );

    return {
      userCount,
      users: {
        byStatus,
        byRole,
        registrations: {
          last7Days: newUsersLast7Days,
          last30Days: newUsersLast30Days,
        },
      },
      engagement: {
        bookmarkCount,
        followCount,
        unreadNotificationCount,
      },
      sync: {
        runningJobCount,
        failedSyncCountLast24Hours: failedSyncCount,
        lastSyncAt: recentSyncLogs[0]?.startedAt ?? null,
        recentLogs: recentSyncLogs.map((log) => ({
          id: log.id,
          source: String(log.source).toLowerCase(),
          jobType: String(log.jobType).toLowerCase(),
          status: String(log.status).toLowerCase(),
          startedAt: log.startedAt,
          finishedAt: log.finishedAt,
          insertedCount: log.totalInserted,
          updatedCount: log.totalUpdated,
          errorCount: log.totalErrors,
          sourceName: log.config.apiName,
        })),
      },
      sources: sourceConfigs.map((source) => {
        const latestSync = source.syncLogs[0];
        return {
          id: source.id,
          name: source.apiName,
          isActive: source.isActive,
          lastTestedAt: source.lastTestedAt,
          latestSyncStatus: latestSync
            ? String(latestSync.status).toLowerCase()
            : null,
          latestSyncAt: latestSync?.startedAt ?? null,
          failedSyncCountLast24Hours: failedByConfig.get(source.id) ?? 0,
        };
      }),
    };
  }

  private async loadDashboardGraphMetrics(last7Days: Date, last30Days: Date) {
    const result = await this.neo4j.executeRead(
      `
      CALL { MATCH (article:Article) RETURN count(article) AS article_count }
      CALL { MATCH (journal:Journal) RETURN count(journal) AS journal_count }
      CALL { MATCH (author:Author) RETURN count(author) AS author_count }
      CALL {
        MATCH (article:Article)
        RETURN sum(CASE WHEN article.hydration_state = 'HYDRATED' THEN 1 ELSE 0 END) AS hydrated_articles,
               sum(CASE WHEN article.hydration_state = 'PLACEHOLDER' THEN 1 ELSE 0 END) AS placeholder_articles,
               sum(CASE WHEN article.hydration_state = 'HYDRATED' AND trim(coalesce(article.doi, '')) = '' THEN 1 ELSE 0 END) AS missing_doi,
               sum(CASE WHEN article.hydration_state = 'HYDRATED' AND trim(coalesce(article.abstract, '')) = '' THEN 1 ELSE 0 END) AS missing_abstract,
               sum(CASE WHEN article.hydration_state = 'HYDRATED' AND NOT EXISTS { MATCH (:Author)-[:WROTE]->(article) } THEN 1 ELSE 0 END) AS missing_authors
      }
      CALL {
        MATCH (article:Article)
        WHERE article.hydration_state = 'HYDRATED' AND article.first_crawled_at >= datetime($last7Days)
        RETURN count(article) AS articles_7_days
      }
      CALL {
        MATCH (journal:Journal)
        WHERE journal.first_crawled_at >= datetime($last7Days)
        RETURN count(journal) AS journals_7_days
      }
      CALL {
        MATCH (author:Author)-[:WROTE]->(article:Article)
        WHERE article.hydration_state = 'HYDRATED' AND article.first_crawled_at >= datetime($last7Days)
        RETURN count(DISTINCT author) AS authors_7_days
      }
      CALL {
        MATCH (article:Article)
        WHERE article.hydration_state = 'HYDRATED' AND article.first_crawled_at >= datetime($last30Days)
        RETURN count(article) AS articles_30_days
      }
      CALL {
        MATCH (journal:Journal)
        WHERE journal.first_crawled_at >= datetime($last30Days)
        RETURN count(journal) AS journals_30_days
      }
      CALL {
        MATCH (author:Author)-[:WROTE]->(article:Article)
        WHERE article.hydration_state = 'HYDRATED' AND article.first_crawled_at >= datetime($last30Days)
        RETURN count(DISTINCT author) AS authors_30_days
      }
      CALL {
        MATCH (journal:Journal)
        OPTIONAL MATCH (article:Article {hydration_state: 'HYDRATED'})-[:PUBLISHED_IN]->(journal)
        WITH journal, count(article) AS article_count
        ORDER BY article_count DESC, coalesce(journal.display_name, '') ASC
        LIMIT $topLimit
        RETURN collect({ id: journal.id, title: journal.display_name, articleCount: article_count }) AS top_journals
      }
      CALL {
        MATCH (article:Article)
        WHERE article.hydration_state = 'HYDRATED'
        WITH article
        ORDER BY coalesce(article.citation_count, 0) DESC, coalesce(article.title, '') ASC
        LIMIT $topLimit
        RETURN collect({ id: article.id, title: article.title, citationCount: coalesce(article.citation_count, 0), publicationYear: article.publication_year }) AS top_articles
      }
      RETURN article_count, journal_count, author_count,
             hydrated_articles, placeholder_articles, missing_doi, missing_abstract, missing_authors,
             articles_7_days, journals_7_days, authors_7_days,
             articles_30_days, journals_30_days, authors_30_days,
             top_journals, top_articles
      `,
      {
        last7Days: last7Days.toISOString(),
        last30Days: last30Days.toISOString(),
        topLimit: neo4j.int(DASHBOARD_TOP_LIMIT),
      },
      (record) => this.toDashboardGraphMetrics(record.toObject()),
    );

    return result.records[0] ?? EMPTY_DASHBOARD_GRAPH;
  }

  private toDashboardGraphMetrics(row: Record<string, unknown>) {
    const values = this.toPlain(row) as Record<string, unknown>;
    const count = (key: string) => Number(values[key] ?? 0);
    return {
      articleCount: count('article_count'),
      journalCount: count('journal_count'),
      authorCount: count('author_count'),
      growth: {
        last7Days: {
          articles: count('articles_7_days'),
          journals: count('journals_7_days'),
          authorsWithNewArticles: count('authors_7_days'),
        },
        last30Days: {
          articles: count('articles_30_days'),
          journals: count('journals_30_days'),
          authorsWithNewArticles: count('authors_30_days'),
        },
      },
      rankings: {
        topJournals: (values.top_journals as unknown[]) ?? [],
        topArticles: (values.top_articles as unknown[]) ?? [],
      },
      dataQuality: {
        hydratedArticles: count('hydrated_articles'),
        placeholderArticles: count('placeholder_articles'),
        missingDoi: count('missing_doi'),
        missingAbstract: count('missing_abstract'),
        missingAuthors: count('missing_authors'),
      },
    };
  }

  async listSyncLogs(input: {
    page: number;
    pageSize: number;
    source?: string | null;
    dataType?: string | null;
    status?: string | null;
    startedFrom?: Date | null;
    startedTo?: Date | null;
  }) {
    const where = {
      ...(input.source ? { source: input.source as SyncSource } : {}),
      ...(input.dataType ? { jobType: input.dataType as never } : {}),
      ...(input.status ? { status: input.status as SyncStatus } : {}),
      ...(input.startedFrom || input.startedTo
        ? {
            startedAt: {
              ...(input.startedFrom ? { gte: input.startedFrom } : {}),
              ...(input.startedTo ? { lte: input.startedTo } : {}),
            },
          }
        : {}),
    };
    const [totalItems, rows] = await this.prisma.$transaction([
      this.prisma.syncLog.count({ where }),
      this.prisma.syncLog.findMany({
        where,
        include: { config: true, jobRun: true },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return this.page(
      rows.map((row) => this.toSyncLog(row)),
      input,
      totalItems,
    );
  }

  async getSyncLog(id: string) {
    const row = await this.prisma.syncLog.findUnique({
      where: { id },
      include: { config: true, jobRun: true },
    });
    if (!row) {
      throw new NotFoundException('Sync log not found');
    }

    return this.toSyncLog(row, true);
  }

  async listJobs() {
    return Promise.all(
      ACADEMIC_PIPELINE_QUEUE_NAMES.map((jobId) => this.toJobView(jobId)),
    );
  }

  async getJob(jobId: string) {
    return this.toJobView(this.assertJobId(jobId), true);
  }

  async pause(jobId: string, actor: AdminActor, reason: string | null) {
    return this.withAudit(jobId, 'pause', actor, reason, async () => {
      const id = this.assertJobId(jobId);
      const control = await this.prisma.academicJobControl.findUnique({
        where: { jobId: id },
      });
      if (control?.isPaused) {
        throw new ConflictException(
          'Job scheduler and queue are already paused',
        );
      }

      try {
        await this.queues.getQueue(id).pause();
        await this.prisma.academicJobControl.upsert({
          where: { jobId: id },
          update: {
            isPaused: true,
            pausedAt: new Date(),
            pausedByUserId: actor.userId,
            pausedByEmail: actor.email,
          },
          create: {
            jobId: id,
            isPaused: true,
            pausedAt: new Date(),
            pausedByUserId: actor.userId,
            pausedByEmail: actor.email,
          },
        });
      } catch (error) {
        throw this.queueUnavailable(error);
      }

      return this.toJobView(id, true);
    });
  }

  async resume(jobId: string, actor: AdminActor, reason: string | null) {
    return this.withAudit(jobId, 'resume', actor, reason, async () => {
      const id = this.assertJobId(jobId);
      const control = await this.prisma.academicJobControl.findUnique({
        where: { jobId: id },
      });
      if (!control?.isPaused) {
        throw new ConflictException('Job scheduler and queue are not paused');
      }

      try {
        await this.queues.getQueue(id).resume();
        await this.prisma.academicJobControl.update({
          where: { jobId: id },
          data: {
            isPaused: false,
            pausedAt: null,
            pausedByUserId: null,
            pausedByEmail: null,
          },
        });
      } catch (error) {
        throw this.queueUnavailable(error);
      }

      return this.toJobView(id, true);
    });
  }

  async trigger(jobId: string, actor: AdminActor, reason: string | null) {
    return this.withAudit(jobId, 'trigger', actor, reason, async () => {
      const id = this.assertJobId(jobId);
      await this.assertCanStart(id);
      const run = await this.enqueueRun({
        jobId: id,
        trigger: 'MANUAL',
        actor,
      });
      return { run, job: await this.toJobView(id, true) };
    });
  }

  async cancel(jobId: string, actor: AdminActor, reason: string | null) {
    return this.withAudit(jobId, 'cancel', actor, reason, async (setRunId) => {
      const id = this.assertJobId(jobId);
      const run = await this.prisma.academicJobRun.findFirst({
        where: { jobId: id, status: AcademicJobRunStatus.RUNNING },
        orderBy: { startedAt: 'asc' },
      });
      const waitingRun =
        run ??
        (await this.prisma.academicJobRun.findFirst({
          where: { jobId: id, status: AcademicJobRunStatus.WAITING },
          orderBy: { queuedAt: 'asc' },
        }));
      if (!waitingRun) {
        throw new ConflictException(
          'No active or waiting job run can be cancelled',
        );
      }
      await setRunId(waitingRun.id);

      if (waitingRun.status === AcademicJobRunStatus.RUNNING) {
        await this.prisma.academicJobRun.update({
          where: { id: waitingRun.id },
          data: { cancellationRequestedAt: new Date() },
        });
      } else {
        try {
          const bullJob = waitingRun.bullJobId
            ? await this.queues.getQueue(id).getJob(waitingRun.bullJobId)
            : null;
          await bullJob?.remove();
        } catch (error) {
          throw this.queueUnavailable(error);
        }
        await this.prisma.academicJobRun.update({
          where: { id: waitingRun.id },
          data: {
            status: AcademicJobRunStatus.CANCELLED,
            finishedAt: new Date(),
          },
        });
      }

      return {
        runId: waitingRun.id,
        cancellationRequested:
          waitingRun.status === AcademicJobRunStatus.RUNNING,
        job: await this.toJobView(id, true),
      };
    });
  }

  async retry(jobId: string, actor: AdminActor, reason: string | null) {
    return this.withAudit(jobId, 'retry', actor, reason, async (setRunId) => {
      const id = this.assertJobId(jobId);
      await this.assertCanStart(id);
      const previous = await this.prisma.academicJobRun.findFirst({
        where: { jobId: id },
        orderBy: { queuedAt: 'desc' },
      });
      if (
        !previous ||
        (previous.status !== AcademicJobRunStatus.FAILED &&
          previous.status !== AcademicJobRunStatus.CANCELLED)
      ) {
        throw new ConflictException(
          'Only the latest failed or cancelled run can be retried',
        );
      }
      const run = await this.enqueueRun({
        jobId: id,
        trigger: 'RETRY',
        actor,
        retriedFromRunId: previous.id,
      });
      await setRunId(run.id);
      return { run, job: await this.toJobView(id, true) };
    });
  }

  async listJournals(
    input: AdminPageInput &
      AdminDateRangeInput & { q?: string | null; source?: string | null },
  ) {
    const where = this.journalWhere(input);
    const count = await this.neo4j.executeRead(
      `MATCH (journal:Journal) WHERE ${where} RETURN count(journal) AS total`,
      this.graphParameters(input),
      (record) => Number(record.get('total').toString()),
    );
    const rows = await this.neo4j.executeRead(
      `
      MATCH (journal:Journal)
      WHERE ${where}
      WITH journal
      ORDER BY journal.last_synced_at DESC, journal.id ASC
      SKIP $skip LIMIT $limit
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, count(article) AS article_count
      RETURN journal.id AS id,
             journal.display_name AS title,
             coalesce(journal.issn_list, []) AS issn,
             coalesce(journal.crawl_source, 'OPENALEX') AS source,
             journal.first_crawled_at AS first_crawled_at,
             journal.last_synced_at AS last_synced_at,
             article_count
      ORDER BY journal.last_synced_at DESC, journal.id ASC
      `,
      this.graphParameters(input),
      (record) => this.toJournalSummary(record.toObject()),
    );
    return this.page(rows.records, input, count.records[0] ?? 0);
  }

  async getJournal(id: string) {
    const result = await this.neo4j.executeRead(
      `
      MATCH (journal:Journal {id: $id})
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, count(article) AS article_count
      RETURN journal { .id, title: journal.display_name, issn: journal.issn_list,
                       source: journal.crawl_source, firstCrawledAt: journal.first_crawled_at,
                       lastSyncedAt: journal.last_synced_at, .type, isOpenAccess: journal.is_open_access,
                       isOaDiamond: journal.is_oa_diamond, .coverage, .country,
                       publisherName: journal.publisher_name, subjectCategories: journal.subject_categories,
                       scimagoSourceId: journal.scimago_source_id, scimagoCatalogYear: journal.scimago_catalog_year,
                       articleCount: article_count } AS journal
      `,
      { id },
      (record) => record.get('journal') as Record<string, unknown>,
    );
    const journal = result.records[0];
    if (!journal) {
      throw new NotFoundException('Journal not found');
    }
    const syncState = await this.prisma.academicJournalSyncState.findFirst({
      where: { openAlexJournalId: id },
    });
    return {
      ...this.toPlain(journal),
      sync: syncState
        ? {
            matchStatus: syncState.matchStatus,
            syncMode: syncState.syncMode,
            initialBackfillComplete: syncState.initialBackfillComplete,
            lastResolvedAt: syncState.lastResolvedAt,
            lastSuccessfulAt: syncState.lastSuccessfulAt,
            errorDetail: syncState.errorDetail,
          }
        : null,
    };
  }

  async listArticles(
    input: AdminPageInput &
      AdminDateRangeInput & {
        q?: string | null;
        source?: string | null;
        journalId?: string | null;
      },
  ) {
    const where = this.articleWhere(input);
    const count = await this.neo4j.executeRead(
      `MATCH (article:Article) WHERE ${where} RETURN count(article) AS total`,
      this.graphParameters(input),
      (record) => Number(record.get('total').toString()),
    );
    const rows = await this.neo4j.executeRead(
      `
      MATCH (article:Article)
      WHERE ${where}
      WITH article
      ORDER BY article.last_synced_at DESC, article.id ASC
      SKIP $skip LIMIT $limit
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(matched_journal:Journal)
      WITH article, head(collect(matched_journal)) AS journal
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, collect(author { .id, name: author.display_name, order: wrote.author_position }) AS authors
      RETURN article.id AS id,
             article.title AS title,
             authors,
             CASE WHEN journal IS NULL THEN NULL ELSE journal { .id, title: journal.display_name, issn: journal.issn_list } END AS journal,
             coalesce(article.crawl_source, 'OPENALEX') AS source,
             article.first_crawled_at AS first_crawled_at,
             article.last_synced_at AS last_synced_at
      ORDER BY article.last_synced_at DESC, article.id ASC
      `,
      this.graphParameters(input),
      (record) => this.toArticleSummary(record.toObject()),
    );
    return this.page(rows.records, input, count.records[0] ?? 0);
  }

  async getArticle(id: string) {
    const result = await this.neo4j.executeRead(
      `
      MATCH (article:Article {id: $id})
      WHERE article.hydration_state = 'HYDRATED'
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, collect(author { .id, name: author.display_name, order: wrote.author_position }) AS authors
      RETURN article { .id, .title, .abstract, .doi, publicationYear: article.publication_year,
                       .version, volumeNumber: article.volume_number, issueNumber: article.issue_number,
                       citationCount: article.citation_count, workType: article.work_type,
                       source: article.crawl_source, firstCrawledAt: article.first_crawled_at,
                       lastSyncedAt: article.last_synced_at, hydrationState: article.hydration_state,
                       outgoingReferencesCrawledAt: article.outgoing_references_crawled_at,
                       incomingCitationsCrawledAt: article.incoming_citations_crawled_at,
                       citationCountUpdatedAt: article.citation_count_updated_at,
                       relatedWorksSyncedAt: article.related_works_synced_at } AS article,
             authors,
             CASE WHEN journal IS NULL THEN NULL ELSE journal { .id, title: journal.display_name, issn: journal.issn_list, source: journal.crawl_source } END AS journal
      `,
      { id },
      (record) => ({
        article: this.toPlain(record.get('article') as Record<string, unknown>),
        authors: this.sortAuthors(
          this.toPlain(record.get('authors')) as Array<Record<string, unknown>>,
        ),
        journal: this.toPlain(
          record.get('journal') as Record<string, unknown> | null,
        ),
      }),
    );
    const row = result.records[0];
    if (!row) {
      throw new NotFoundException('Article not found');
    }
    return { ...row.article, authors: row.authors, journal: row.journal };
  }

  private async toJobView(jobId: AcademicPipelineQueueName, detail = false) {
    const [control, currentRun, latestRun] = await Promise.all([
      this.prisma.academicJobControl.findUnique({ where: { jobId } }),
      this.prisma.academicJobRun.findFirst({
        where: {
          jobId,
          status: {
            in: [AcademicJobRunStatus.RUNNING, AcademicJobRunStatus.WAITING],
          },
        },
        orderBy: [{ status: 'asc' }, { queuedAt: 'asc' }],
      }),
      this.prisma.academicJobRun.findFirst({
        where: { jobId },
        orderBy: { queuedAt: 'desc' },
      }),
    ]);
    const definition = ACADEMIC_PIPELINE_JOB_DEFINITIONS[jobId];
    const active = currentRun ?? latestRun;
    const paused = control?.isPaused ?? false;
    const status = paused
      ? 'paused'
      : currentRun?.status === AcademicJobRunStatus.RUNNING
        ? 'running'
        : currentRun?.status === AcademicJobRunStatus.WAITING
          ? 'waiting'
          : latestRun
            ? this.publicRunStatus(latestRun.status)
            : 'waiting';
    const result = {
      id: jobId,
      name: definition.displayName,
      queueName: jobId,
      dataType: definition.dataType,
      source: definition.source,
      cron: definition.cron,
      timeZone: definition.timeZone,
      schedulerStatus: paused ? 'paused' : 'active',
      status,
      progress: active ? this.toProgress(active) : null,
      lastError: active?.errorDetail ?? null,
      lastRunAt: latestRun?.startedAt ?? null,
      nextRunAt: paused
        ? null
        : this.nextRun(definition.cron, definition.timeZone),
      pausedAt: control?.pausedAt ?? null,
    };
    return detail
      ? {
          ...result,
          currentRun: currentRun ? this.toRun(currentRun) : null,
          latestRun: latestRun ? this.toRun(latestRun) : null,
        }
      : result;
  }

  private async assertCanStart(jobId: AcademicPipelineQueueName) {
    const [control, active] = await Promise.all([
      this.prisma.academicJobControl.findUnique({ where: { jobId } }),
      this.prisma.academicJobRun.findFirst({
        where: {
          jobId,
          status: {
            in: [AcademicJobRunStatus.WAITING, AcademicJobRunStatus.RUNNING],
          },
        },
      }),
    ]);
    if (control?.isPaused) {
      throw new ConflictException(
        'Paused jobs must be resumed before they can run',
      );
    }
    if (active) {
      throw new ConflictException('A job run is already waiting or running');
    }
  }

  private async enqueueRun(input: {
    jobId: AcademicPipelineQueueName;
    trigger: AcademicPipelineTrigger;
    actor: AdminActor;
    retriedFromRunId?: string;
  }) {
    const scheduledAt = new Date();
    const run = await this.prisma.academicJobRun.create({
      data: {
        jobId: input.jobId,
        trigger: input.trigger as AcademicJobRunTrigger,
        status: AcademicJobRunStatus.WAITING,
        scheduledAt,
        retriedFromRunId: input.retriedFromRunId,
        createdByAdminId: input.actor.userId,
        createdByAdminEmail: input.actor.email,
      },
    });
    try {
      const bullJobId = await this.queues.enqueue(input.jobId, scheduledAt, {
        runId: run.id,
        trigger: input.trigger,
        retriedFromRunId: input.retriedFromRunId,
      });
      return this.toRun(
        await this.prisma.academicJobRun.update({
          where: { id: run.id },
          data: { bullJobId },
        }),
      );
    } catch (error) {
      await this.prisma.academicJobRun.update({
        where: { id: run.id },
        data: {
          status: AcademicJobRunStatus.FAILED,
          finishedAt: new Date(),
          errorDetail: 'Queue enqueue failed',
        },
      });
      throw this.queueUnavailable(error);
    }
  }

  private async withAudit<T>(
    jobId: string,
    action: JobAction,
    actor: AdminActor,
    reason: string | null,
    operation: (setRunId: (runId: string) => Promise<void>) => Promise<T>,
  ) {
    const audit = await this.prisma.academicJobAudit
      .create({
        data: {
          jobId,
          adminUserId: actor.userId,
          adminEmail: actor.email,
          action: action.toUpperCase() as AcademicJobAuditAction,
          outcome: AcademicJobAuditOutcome.PENDING,
          reason,
        },
      })
      .catch(() => {
        throw new ServiceUnavailableException('Audit logging is unavailable');
      });
    try {
      const result = await operation(async (runId) => {
        await this.prisma.academicJobAudit.update({
          where: { id: audit.id },
          data: { runId },
        });
      });
      await this.prisma.academicJobAudit.update({
        where: { id: audit.id },
        data: {
          outcome: AcademicJobAuditOutcome.SUCCESS,
          completedAt: new Date(),
        },
      });
      return result;
    } catch (error) {
      const rejected =
        error instanceof ConflictException ||
        error instanceof NotFoundException;
      await this.prisma.academicJobAudit.update({
        where: { id: audit.id },
        data: {
          outcome: rejected
            ? AcademicJobAuditOutcome.REJECTED
            : AcademicJobAuditOutcome.FAILED,
          completedAt: new Date(),
          errorDetail:
            error instanceof Error ? error.message : 'Job action failed',
        },
      });
      throw error;
    }
  }

  private assertJobId(jobId: string): AcademicPipelineQueueName {
    if (!(jobId in ACADEMIC_PIPELINE_JOB_DEFINITIONS)) {
      throw new NotFoundException('Academic pipeline job not found');
    }
    return jobId as AcademicPipelineQueueName;
  }

  private journalWhere(
    input: AdminDateRangeInput & { q?: string | null; source?: string | null },
  ) {
    const clauses: string[] = [];
    if (input.q) {
      clauses.push(`(toLower(coalesce(journal.display_name, '')) CONTAINS toLower($q)
        OR any(issn IN coalesce(journal.issn_list, []) WHERE toLower(issn) CONTAINS toLower($q)))`);
    }
    if (input.source) {
      clauses.push('journal.crawl_source = $source');
    }
    if (input.firstCrawledFrom) {
      clauses.push('journal.first_crawled_at >= datetime($firstCrawledFrom)');
    }
    if (input.firstCrawledTo) {
      clauses.push('journal.first_crawled_at <= datetime($firstCrawledTo)');
    }
    if (input.lastSyncedFrom) {
      clauses.push('journal.last_synced_at >= datetime($lastSyncedFrom)');
    }
    if (input.lastSyncedTo) {
      clauses.push('journal.last_synced_at <= datetime($lastSyncedTo)');
    }
    return clauses.length > 0 ? clauses.join('\n      AND ') : 'true';
  }

  private articleWhere(
    input: AdminDateRangeInput & {
      q?: string | null;
      source?: string | null;
      journalId?: string | null;
    },
  ) {
    const clauses = ["article.hydration_state = 'HYDRATED'"];
    if (input.q) {
      clauses.push("toLower(coalesce(article.title, '')) CONTAINS toLower($q)");
    }
    if (input.journalId) {
      clauses.push(`EXISTS {
        MATCH (article)-[:PUBLISHED_IN]->(:Journal {id: $journalId})
      }`);
    }
    if (input.source) {
      clauses.push('article.crawl_source = $source');
    }
    if (input.firstCrawledFrom) {
      clauses.push('article.first_crawled_at >= datetime($firstCrawledFrom)');
    }
    if (input.firstCrawledTo) {
      clauses.push('article.first_crawled_at <= datetime($firstCrawledTo)');
    }
    if (input.lastSyncedFrom) {
      clauses.push('article.last_synced_at >= datetime($lastSyncedFrom)');
    }
    if (input.lastSyncedTo) {
      clauses.push('article.last_synced_at <= datetime($lastSyncedTo)');
    }
    return clauses.join('\n      AND ');
  }

  private graphParameters(
    input: AdminPageInput &
      AdminDateRangeInput & {
        q?: string | null;
        source?: string | null;
        journalId?: string | null;
      },
  ) {
    return {
      q: input.q ?? null,
      source: input.source ?? null,
      journalId: input.journalId ?? null,
      firstCrawledFrom: input.firstCrawledFrom ?? null,
      firstCrawledTo: input.firstCrawledTo ?? null,
      lastSyncedFrom: input.lastSyncedFrom ?? null,
      lastSyncedTo: input.lastSyncedTo ?? null,
      skip: neo4j.int((input.page - 1) * input.pageSize),
      limit: neo4j.int(input.pageSize),
    };
  }

  private page<T>(items: T[], input: AdminPageInput, totalItems: number) {
    return {
      items,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / input.pageSize),
      },
    };
  }

  private toSyncLog(row: any, detail = false) {
    const result = {
      id: row.id,
      source: row.source,
      dataType: row.jobType,
      status: String(row.status).toLowerCase(),
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      successCount: row.successCount,
      failureCount: row.failureCount,
      errorDetail: row.errorDetail,
    };
    return detail
      ? {
          ...result,
          apiName: row.config.apiName,
          apiEndpoint: row.config.apiEndpoint,
          runId: row.jobRunId,
          totalFetched: row.totalFetched,
          totalInserted: row.totalInserted,
          totalUpdated: row.totalUpdated,
          totalErrors: row.totalErrors,
          metrics: row.metrics ?? {},
        }
      : result;
  }

  private toRun(run: any) {
    return {
      id: run.id,
      jobId: run.jobId,
      trigger: String(run.trigger).toLowerCase(),
      status: this.publicRunStatus(run.status),
      scheduledAt: run.scheduledAt,
      queuedAt: run.queuedAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      progress: this.toProgress(run),
      attemptCount: run.attemptCount,
      errorDetail: run.errorDetail,
      cancellationRequestedAt: run.cancellationRequestedAt,
      retriedFromRunId: run.retriedFromRunId,
    };
  }

  private toProgress(run: any) {
    return {
      current: run.progressCurrent,
      total: run.progressTotal,
      percentage:
        run.progressTotal && run.progressTotal > 0
          ? Math.floor((run.progressCurrent / run.progressTotal) * 100)
          : null,
      message: run.progressMessage,
    };
  }

  private publicRunStatus(status: AcademicJobRunStatus) {
    return String(status).toLowerCase();
  }

  private nextRun(cron: string, timeZone: string) {
    return parseExpression(cron, { tz: timeZone }).next().toDate();
  }

  private toJournalSummary(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      title: row.title ?? null,
      issn: this.toPlain(row.issn) ?? [],
      source: row.source ?? 'OPENALEX',
      firstCrawledAt: this.toDateValue(row.first_crawled_at),
      lastSyncedAt: this.toDateValue(row.last_synced_at),
      articleCount: Number(
        row.article_count?.toString?.() ?? row.article_count ?? 0,
      ),
    };
  }

  private toArticleSummary(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      title: row.title ?? null,
      authors: this.sortAuthors(
        this.toPlain(row.authors) as Array<Record<string, unknown>>,
      ),
      journal: this.toPlain(row.journal as Record<string, unknown> | null),
      source: row.source ?? 'OPENALEX',
      firstCrawledAt: this.toDateValue(row.first_crawled_at),
      lastSyncedAt: this.toDateValue(row.last_synced_at),
    };
  }

  private sortAuthors(authors: Array<Record<string, unknown>> = []) {
    return authors
      .filter((author) => author.id)
      .map((author) => ({
        id: String(author.id),
        name: author.name ?? null,
        order: author.order == null ? null : Number(author.order),
      }))
      .sort(
        (left, right) =>
          (left.order ?? Number.MAX_SAFE_INTEGER) -
          (right.order ?? Number.MAX_SAFE_INTEGER),
      );
  }

  private toDateValue(value: unknown) {
    if (value == null) {
      return null;
    }
    return typeof (value as { toString?: unknown }).toString === 'function'
      ? String(value)
      : value;
  }

  private toPlain(value: any): any {
    if (value == null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.toPlain(item));
    }
    if (typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    if (
      typeof value.toString === 'function' &&
      value.constructor?.name?.includes('Date')
    ) {
      return String(value);
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, this.toPlain(item)]),
    );
  }

  private queueUnavailable(error: unknown): ServiceUnavailableException {
    void error;
    return new ServiceUnavailableException('Job queue is unavailable');
  }
}
