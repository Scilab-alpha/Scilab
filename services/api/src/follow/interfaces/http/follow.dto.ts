import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FollowQueryDto {
  @ApiPropertyOptional({ enum: ['AUTHOR', 'JOURNAL', 'KEYWORD', 'TOPIC'] })
  type?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  limit?: string;
}

export class ToggleFollowDto {
  @ApiProperty({ enum: ['AUTHOR', 'JOURNAL', 'KEYWORD', 'TOPIC'] })
  objectType!: string;

  @ApiProperty({
    description:
      'Academic graph reference id for the author, journal, keyword, or topic.',
    maxLength: 128,
    example: 'S123456789',
  })
  objectId!: string;

  @ApiPropertyOptional({
    enum: ['IN_APP', 'DAILY_EMAIL', 'WEEKLY_EMAIL', 'OFF'],
  })
  notifyMode?: string;
}

export class UpdateFollowNotifyModeDto {
  @ApiProperty({ enum: ['IN_APP', 'DAILY_EMAIL', 'WEEKLY_EMAIL', 'OFF'] })
  notifyMode!: string;
}
