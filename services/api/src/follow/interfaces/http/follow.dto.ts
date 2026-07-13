import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FollowQueryDto {
  @ApiPropertyOptional({ enum: ['JOURNAL', 'KEYWORD', 'TOPIC'] })
  type?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  limit?: string;
}

export class ToggleFollowDto {
  @ApiProperty({ enum: ['JOURNAL', 'KEYWORD', 'TOPIC'] })
  objectType!: string;

  @ApiProperty({ format: 'uuid' })
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
