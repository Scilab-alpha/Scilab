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
  CompleteAcademicPipelineJobInput,
  FailAcademicPipelineJobInput,
} from '@repo/academic/application/ports/academic-sync-log.port';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaAcademicSyncLogRepository implements AcademicSyncLogRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        jobType: toPrismaSyncJobType(input.jobType),
        startedAt: input.startedAt,
        status: SyncStatus.RUNNING,
      },
    });

    return syncLog.id;
  }

  async completePipelineJob(
    syncLogId: string,
    input: CompleteAcademicPipelineJobInput,
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

  async failPipelineJob(
    syncLogId: string,
    input: FailAcademicPipelineJobInput,
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

function toPrismaSyncJobType(
  jobType: StartAcademicPipelineJobInput['jobType'],
): SyncJobType {
  void jobType;
  return SyncJobType.SCHEDULED_SYNC;
}
