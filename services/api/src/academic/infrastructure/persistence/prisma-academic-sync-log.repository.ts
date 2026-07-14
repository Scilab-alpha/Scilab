import { Injectable } from '@nestjs/common';
import {
  SyncFrequency,
  SyncJobType,
  SyncSource,
  SyncStatus,
} from '@prisma/client';
import {
  AcademicSyncLogRepository,
  StartAcademicPipelineJobInput,
  CompleteOpenAlexSyncLogInput,
  FailOpenAlexSyncLogInput,
  StartOpenAlexSyncLogInput,
} from '@/academic/application/ports/academic-sync-log.port';
import { PrismaService } from '@/prisma/prisma.service';

const OPENALEX_CONFIG_NAME = 'OpenAlex';

@Injectable()
export class PrismaAcademicSyncLogRepository implements AcademicSyncLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async startOpenAlexScheduledSync(
    input: StartOpenAlexSyncLogInput,
  ): Promise<string> {
    return this.startPipelineJob({
      apiName: OPENALEX_CONFIG_NAME,
      apiEndpoint: input.apiEndpoint,
      source: 'OPENALEX',
      jobType: 'ARTICLE_SYNC',
      startedAt: input.startedAt,
    });
  }

  async startPipelineJob(
    input: StartAcademicPipelineJobInput,
  ): Promise<string> {
    const config = await this.prisma.systemConfig.upsert({
      where: { apiName: input.apiName },
      update: {
        apiEndpoint: input.apiEndpoint,
        syncFrequency: SyncFrequency.DAILY,
        isActive: true,
      },
      create: {
        apiName: input.apiName,
        apiEndpoint: input.apiEndpoint,
        syncFrequency: SyncFrequency.DAILY,
        isActive: true,
      },
    });

    const syncLog = await this.prisma.syncLog.create({
      data: {
        configId: config.id,
        source: SyncSource[input.source],
        jobType: SyncJobType[input.jobType],
        startedAt: input.startedAt,
        status: SyncStatus.RUNNING,
      },
    });

    return syncLog.id;
  }

  async completeOpenAlexSync(
    syncLogId: string,
    input: CompleteOpenAlexSyncLogInput,
  ): Promise<void> {
    await this.completePipelineJob(syncLogId, input);
  }

  async completePipelineJob(
    syncLogId: string,
    input: CompleteOpenAlexSyncLogInput,
  ): Promise<void> {
    await this.prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        finishedAt: input.finishedAt,
        status:
          input.status === 'PARTIAL' ? SyncStatus.PARTIAL : SyncStatus.SUCCESS,
        totalFetched: input.totalFetched,
        totalInserted: input.totalInserted,
        totalUpdated: input.totalUpdated,
        totalErrors: input.totalErrors,
      },
    });
  }

  async failOpenAlexSync(
    syncLogId: string,
    input: FailOpenAlexSyncLogInput,
  ): Promise<void> {
    await this.failPipelineJob(syncLogId, input);
  }

  async failPipelineJob(
    syncLogId: string,
    input: FailOpenAlexSyncLogInput,
  ): Promise<void> {
    await this.prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        finishedAt: input.finishedAt,
        status: SyncStatus.FAILED,
        totalFetched: input.totalFetched,
        totalInserted: input.totalInserted,
        totalUpdated: input.totalUpdated,
        totalErrors: input.totalErrors,
        errorDetail: input.errorDetail,
      },
    });
  }
}
