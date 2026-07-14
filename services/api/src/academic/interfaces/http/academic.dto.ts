import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcademicCursorQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor returned by the previous page.',
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of records to return. Defaults to 20, maximum 100.',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  limit?: string;
}

export class AcademicArticleQueryDto extends AcademicCursorQueryDto {
  @ApiPropertyOptional({
    description:
      'Text search across article title, abstract, keywords, and topics.',
    example: 'machine learning',
  })
  q?: string;

  @ApiPropertyOptional({ description: 'Exact related keyword id.' })
  keywordId?: string;

  @ApiPropertyOptional({ description: 'Exact related topic id.' })
  topicId?: string;

  @ApiPropertyOptional({ description: 'Exact author id.' })
  authorId?: string;

  @ApiPropertyOptional({ description: 'Exact journal id.' })
  journalId?: string;

  @ApiPropertyOptional({
    description: 'Exact publication year.',
    example: 2025,
  })
  publicationYear?: string;

  @ApiPropertyOptional({
    description: 'Inclusive publication year lower bound.',
    example: 2020,
  })
  publicationYearFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive publication year upper bound.',
    example: 2025,
  })
  publicationYearTo?: string;

  @ApiPropertyOptional({
    description: 'Publisher name matched after normalization.',
  })
  publisher?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code.',
    example: 'US',
  })
  country?: string;

  @ApiPropertyOptional({
    enum: ['relevant', 'newest', 'most_cited'],
    description:
      'Sort order. Defaults to relevant for research queries and newest otherwise.',
  })
  sort?: string;
}

export class JournalRankingListQueryDto extends AcademicCursorQueryDto {
  @ApiProperty({
    description: 'Exact SCImago ranking year to return.',
    example: 2023,
  })
  year!: string;
}
