import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatchUserDataDto {
  @ApiPropertyOptional({ format: 'email' })
  email?: string;

  @ApiPropertyOptional({ example: 'Test' })
  firstname?: string;

  @ApiPropertyOptional({ example: 'User' })
  lastname?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender?: string;

  @ApiPropertyOptional({ format: 'date', example: '2001-04-12' })
  dateofbirth?: string;
}

export class PatchUserRoleDto {
  @ApiProperty({ enum: ['STUDENT', 'RESEARCHER'] })
  role!: string;
}

export class PatchUserStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  status!: string;
}
