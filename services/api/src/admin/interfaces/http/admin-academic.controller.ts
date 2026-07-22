import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { createSuccessResponse } from '@/shared/response/response.factory';
import { AdminAcademicService } from '@/admin/application/admin-academic.service';
import {
  AdminCrawledArticleQueryDto,
  AdminCrawledJournalQueryDto,
  AdminJobActionDto,
  AdminPageQueryDto,
  AdminSyncLogQueryDto,
} from '@/admin/interfaces/http/admin-academic.dto';
import {
  ApiAdminAction,
  ApiAdminDashboardMetrics,
  ApiAdminRead,
} from '@/admin/interfaces/http/admin-academic.swagger';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';

const DATA_TYPES = new Set([
  'SCIMAGO_RELOAD',
  'JOURNAL_SOURCE_SYNC',
  'JOURNAL_ARTICLE_SYNC',
  'RELATED_WORK_SYNC',
  'RELATED_WORK_HYDRATION',
  'OUTGOING_REFERENCE_CRAWL',
  'REFERENCE_HYDRATION',
  'INCOMING_CITATION_CRAWL',
  'CITATION_COUNT_REFRESH',
]);
const SOURCES = new Set(['OPENALEX', 'SCIMAGO']);
const SYNC_STATUSES = new Set([
  'RUNNING',
  'SUCCESS',
  'PARTIAL',
  'FAILED',
  'CANCELLED',
]);
const ACADEMIC_JOB_IDS = [
  'scimago-reload',
  'journal-source-sync',
  'journal-article-sync',
  'related-work-sync',
  'related-work-hydration',
  'outgoing-reference',
  'reference-hydration',
  'incoming-citation',
  'citation-count-refresh',
] as const;
const ACADEMIC_JOB_ID_PARAM = {
  name: 'id',
  enum: ACADEMIC_JOB_IDS,
  example: 'journal-article-sync',
};

@ApiTags('Admin academic sync')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAcademicController {
  constructor(private readonly admin: AdminAcademicService) {}

  @Get('dashboard')
  @ApiAdminDashboardMetrics()
  async getDashboardMetrics() {
    return createSuccessResponse(
      await this.admin.getDashboardMetrics(),
      'Dashboard metrics retrieved',
    );
  }

  @Get('sync-logs')
  @ApiAdminRead('List academic crawl and sync logs', 'Sync logs retrieved')
  async listSyncLogs(@Query() query: AdminSyncLogQueryDto) {
    const range = this.dateRange(query.startedFrom, query.startedTo, 'started');
    this.optionalEnum(query.source, SOURCES, 'source');
    this.optionalEnum(query.dataType, DATA_TYPES, 'dataType');
    this.optionalEnum(query.status, SYNC_STATUSES, 'status');
    const page = await this.admin.listSyncLogs({
      ...this.page(query),
      source: query.source?.trim() || null,
      dataType: query.dataType?.trim() || null,
      status: query.status?.trim() || null,
      startedFrom: range.from,
      startedTo: range.to,
    });
    return createSuccessResponse(page, 'Sync logs retrieved');
  }

  @Get('sync-logs/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAdminRead('Get an academic crawl or sync log', 'Sync log retrieved')
  async getSyncLog(@Param('id') id: string) {
    return createSuccessResponse(
      await this.admin.getSyncLog(id),
      'Sync log retrieved',
    );
  }

  @Get('jobs')
  @ApiAdminRead(
    'List academic pipeline jobs and queues',
    'Academic jobs retrieved',
  )
  async listJobs() {
    return createSuccessResponse(
      await this.admin.listJobs(),
      'Academic jobs retrieved',
    );
  }

  @Get('jobs/:id')
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiAdminRead('Get an academic pipeline job', 'Academic job retrieved')
  async getJob(@Param('id') id: string) {
    return createSuccessResponse(
      await this.admin.getJob(id),
      'Academic job retrieved',
    );
  }

  @Post('jobs/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiBody({ type: AdminJobActionDto, required: false })
  @ApiAdminAction(
    'Pause an academic scheduler and queue',
    'Academic job paused',
  )
  async pause(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdminJobActionDto = {},
  ) {
    return createSuccessResponse(
      await this.admin.pause(id, this.actor(user), this.reason(body.reason)),
      'Academic job paused',
    );
  }

  @Post('jobs/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiBody({ type: AdminJobActionDto, required: false })
  @ApiAdminAction(
    'Resume an academic scheduler and queue',
    'Academic job resumed',
  )
  async resume(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdminJobActionDto = {},
  ) {
    return createSuccessResponse(
      await this.admin.resume(id, this.actor(user), this.reason(body.reason)),
      'Academic job resumed',
    );
  }

  @Post('jobs/:id/trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiBody({ type: AdminJobActionDto, required: false })
  @ApiAdminAction(
    'Trigger an academic job immediately',
    'Academic job trigger accepted',
    true,
  )
  async trigger(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdminJobActionDto = {},
  ) {
    return createSuccessResponse(
      await this.admin.trigger(id, this.actor(user), this.reason(body.reason)),
      'Academic job trigger accepted',
    );
  }

  @Post('jobs/:id/cancel')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiBody({ type: AdminJobActionDto, required: false })
  @ApiAdminAction(
    'Cancel an active or waiting academic job',
    'Academic job cancellation accepted',
    true,
  )
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdminJobActionDto = {},
  ) {
    return createSuccessResponse(
      await this.admin.cancel(id, this.actor(user), this.reason(body.reason)),
      'Academic job cancellation accepted',
    );
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam(ACADEMIC_JOB_ID_PARAM)
  @ApiBody({ type: AdminJobActionDto, required: false })
  @ApiAdminAction(
    'Retry the latest failed or cancelled academic job',
    'Academic job retry accepted',
    true,
  )
  async retry(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdminJobActionDto = {},
  ) {
    return createSuccessResponse(
      await this.admin.retry(id, this.actor(user), this.reason(body.reason)),
      'Academic job retry accepted',
    );
  }

  @Get('journals')
  @ApiAdminRead('List crawled journals', 'Crawled journals retrieved')
  async listJournals(@Query() query: AdminCrawledJournalQueryDto) {
    this.optionalEnum(query.source, SOURCES, 'source');
    const dates = this.crawlDates(query);
    return createSuccessResponse(
      await this.admin.listJournals({
        ...this.page(query),
        q: this.text(query.q, 'q', 200),
        source: query.source?.trim() || null,
        ...dates,
      }),
      'Crawled journals retrieved',
    );
  }

  @Get('journals/:id')
  @ApiParam({ name: 'id', example: 'S1234567890' })
  @ApiAdminRead('Get a crawled journal', 'Crawled journal retrieved')
  async getJournal(@Param('id') id: string) {
    return createSuccessResponse(
      await this.admin.getJournal(id),
      'Crawled journal retrieved',
    );
  }

  @Get('articles')
  @ApiAdminRead('List crawled articles', 'Crawled articles retrieved')
  async listArticles(@Query() query: AdminCrawledArticleQueryDto) {
    this.optionalEnum(query.source, SOURCES, 'source');
    const dates = this.crawlDates(query);
    return createSuccessResponse(
      await this.admin.listArticles({
        ...this.page(query),
        q: this.text(query.q, 'q', 200),
        source: query.source?.trim() || null,
        journalId: this.text(query.journalId, 'journalId', 255),
        ...dates,
      }),
      'Crawled articles retrieved',
    );
  }

  @Get('articles/:id')
  @ApiParam({ name: 'id', example: 'W1234567890' })
  @ApiAdminRead('Get a crawled article', 'Crawled article retrieved')
  async getArticle(@Param('id') id: string) {
    return createSuccessResponse(
      await this.admin.getArticle(id),
      'Crawled article retrieved',
    );
  }

  private page(query: AdminPageQueryDto) {
    const page = this.integer(
      query.page ?? '1',
      'page',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    const pageSize = this.integer(query.pageSize ?? '20', 'pageSize', 1, 100);
    return { page, pageSize };
  }

  private crawlDates(query: AdminCrawledJournalQueryDto) {
    const first = this.dateRange(
      query.firstCrawledFrom,
      query.firstCrawledTo,
      'firstCrawled',
    );
    const last = this.dateRange(
      query.lastSyncedFrom,
      query.lastSyncedTo,
      'lastSynced',
    );
    return {
      firstCrawledFrom: first.from?.toISOString() ?? null,
      firstCrawledTo: first.to?.toISOString() ?? null,
      lastSyncedFrom: last.from?.toISOString() ?? null,
      lastSyncedTo: last.to?.toISOString() ?? null,
    };
  }

  private dateRange(
    from: string | undefined,
    to: string | undefined,
    field: string,
  ) {
    const start = from ? this.date(from, `${field}From`) : null;
    const end = to ? this.date(to, `${field}To`) : null;
    if (start && end && start > end) {
      throw new BadRequestException(
        `${field}From must be before or equal to ${field}To`,
      );
    }
    return { from: start, to: end };
  }

  private date(value: string, field: string) {
    const date = new Date(value);
    if (value.trim() === '' || Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${field} must be a valid ISO-8601 date-time`,
      );
    }
    return date;
  }

  private integer(value: string, field: string, min: number, max: number) {
    const parsed = Number(value);
    if (
      !Number.isInteger(parsed) ||
      value.trim() === '' ||
      parsed < min ||
      parsed > max
    ) {
      throw new BadRequestException(
        `${field} must be an integer between ${min} and ${max}`,
      );
    }
    return parsed;
  }

  private optionalEnum(
    value: string | undefined,
    values: Set<string>,
    field: string,
  ) {
    if (value && !values.has(value.trim())) {
      throw new BadRequestException(`${field} has an unsupported value`);
    }
  }

  private text(value: string | undefined, field: string, maximum: number) {
    const normalized = value?.trim() || null;
    if (normalized && normalized.length > maximum) {
      throw new BadRequestException(
        `${field} must not exceed ${maximum} characters`,
      );
    }
    return normalized;
  }

  private reason(value: string | undefined) {
    return this.text(value, 'reason', 500);
  }

  private actor(user: AuthenticatedUser) {
    return { userId: user.userId, email: user.email };
  }
}
