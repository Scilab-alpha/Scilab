import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookmarkQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  limit?: string;
}

export class ToggleBookmarkDto {
  @ApiProperty({
    description: 'Academic article id, for example an OpenAlex work id.',
    example: 'W1234567890',
  })
  articleId!: string;
}
