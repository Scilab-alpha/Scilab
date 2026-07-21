import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminPageQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  pageSize?: string;
}

export class AdminSyncLogQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: ['OPENALEX', 'SCIMAGO', 'SEMANTIC_SCHOLAR'] })
  source?: string;

  @ApiPropertyOptional({
    enum: [
      'SCIMAGO_RELOAD',
      'JOURNAL_SOURCE_SYNC',
      'JOURNAL_ARTICLE_SYNC',
      'RELATED_WORK_SYNC',
      'RELATED_WORK_HYDRATION',
      'OUTGOING_REFERENCE_CRAWL',
      'REFERENCE_HYDRATION',
      'INCOMING_CITATION_CRAWL',
      'CITATION_COUNT_REFRESH',
      'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT',
    ],
  })
  dataType?: string;

  @ApiPropertyOptional({
    enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED'],
  })
  status?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  startedFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  startedTo?: string;
}

export class AdminCrawledJournalQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ maxLength: 200 })
  q?: string;

  @ApiPropertyOptional({ enum: ['OPENALEX', 'SCIMAGO', 'SEMANTIC_SCHOLAR'] })
  source?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  firstCrawledFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  firstCrawledTo?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  lastSyncedFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  lastSyncedTo?: string;
}

export class AdminCrawledArticleQueryDto extends AdminCrawledJournalQueryDto {
  @ApiPropertyOptional({ maxLength: 255 })
  journalId?: string;
}

export class AdminJobActionDto {
  @ApiPropertyOptional({ maxLength: 500 })
  reason?: string;
}
