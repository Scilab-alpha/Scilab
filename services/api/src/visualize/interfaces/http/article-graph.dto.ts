import { ApiPropertyOptional } from '@nestjs/swagger';

export class ArticleGraphQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor returned by the previous graph page.',
  })
  cursor?: string;

  @ApiPropertyOptional({
    default: 20,
    description:
      'Number of connected papers to return. Defaults to 20, maximum 100.',
    maximum: 100,
    minimum: 1,
  })
  limit?: string;
}
