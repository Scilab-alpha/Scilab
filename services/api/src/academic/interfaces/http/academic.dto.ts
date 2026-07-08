import { ApiPropertyOptional } from '@nestjs/swagger';

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
      'Keyword text used to search articles by related keyword display name.',
    example: 'machine learning',
  })
  keyword?: string;
}
