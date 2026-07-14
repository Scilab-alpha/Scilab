import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  limit?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  isRead?: string;
}
