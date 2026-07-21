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

@Injectable()
export class AdminAcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly neo4j: Neo4jService,
    private readonly queues: AcademicPipelineQueueProducer,
  ) {}

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
    const where = this.journalWhere();
    const count = await this.neo4j.executeRead(
      `MATCH (journal:Journal) WHERE ${where} RETURN count(journal) AS total`,
      this.graphParameters(input),
      (record) => Number(record.get('total').toString()),
    );
    const rows = await this.neo4j.executeRead(
      `
      MATCH (journal:Journal)
      WHERE ${where}
      OPTIONAL MATCH (article:Article)-[:PUBLISHED_IN]->(journal)
      WITH journal, count(article) AS article_count
      RETURN journal.id AS id,
             journal.display_name AS title,
             coalesce(journal.issn_list, []) AS issn,
             coalesce(journal.crawl_source, 'OPENALEX') AS source,
             journal.first_crawled_at AS first_crawled_at,
             journal.last_synced_at AS last_synced_at,
             article_count
      ORDER BY last_synced_at DESC, id ASC
      SKIP $skip LIMIT $limit
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
    const where = this.articleWhere();
    const count = await this.neo4j.executeRead(
      `MATCH (article:Article) OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal) WHERE ${where} RETURN count(DISTINCT article) AS total`,
      this.graphParameters(input),
      (record) => Number(record.get('total').toString()),
    );
    const rows = await this.neo4j.executeRead(
      `
      MATCH (article:Article)
      OPTIONAL MATCH (article)-[:PUBLISHED_IN]->(journal:Journal)
      WHERE ${where}
      OPTIONAL MATCH (author:Author)-[wrote:WROTE]->(article)
      WITH article, journal, collect(author { .id, name: author.display_name, order: wrote.author_position }) AS authors
      RETURN article.id AS id,
             article.title AS title,
             authors,
             CASE WHEN journal IS NULL THEN NULL ELSE journal { .id, title: journal.display_name, issn: journal.issn_list } END AS journal,
             coalesce(article.crawl_source, 'OPENALEX') AS source,
             article.first_crawled_at AS first_crawled_at,
             article.last_synced_at AS last_synced_at
      ORDER BY last_synced_at DESC, id ASC
      SKIP $skip LIMIT $limit
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

  private journalWhere() {
    return `($q IS NULL OR toLower(coalesce(journal.display_name, '')) CONTAINS toLower($q)
             OR any(issn IN coalesce(journal.issn_list, []) WHERE toLower(issn) CONTAINS toLower($q)))
      AND ($source IS NULL OR coalesce(journal.crawl_source, 'OPENALEX') = $source)
      AND ($firstCrawledFrom IS NULL OR journal.first_crawled_at >= datetime($firstCrawledFrom))
      AND ($firstCrawledTo IS NULL OR journal.first_crawled_at <= datetime($firstCrawledTo))
      AND ($lastSyncedFrom IS NULL OR journal.last_synced_at >= datetime($lastSyncedFrom))
      AND ($lastSyncedTo IS NULL OR journal.last_synced_at <= datetime($lastSyncedTo))`;
  }

  private articleWhere() {
    return `article.hydration_state = 'HYDRATED'
      AND ($q IS NULL OR toLower(coalesce(article.title, '')) CONTAINS toLower($q))
      AND ($journalId IS NULL OR journal.id = $journalId)
      AND ($source IS NULL OR coalesce(article.crawl_source, 'OPENALEX') = $source)
      AND ($firstCrawledFrom IS NULL OR article.first_crawled_at >= datetime($firstCrawledFrom))
      AND ($firstCrawledTo IS NULL OR article.first_crawled_at <= datetime($firstCrawledTo))
      AND ($lastSyncedFrom IS NULL OR article.last_synced_at >= datetime($lastSyncedFrom))
      AND ($lastSyncedTo IS NULL OR article.last_synced_at <= datetime($lastSyncedTo))`;
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
