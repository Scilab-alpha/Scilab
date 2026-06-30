import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['STUDENT', 'RESEARCHER'] })
  role!: string;
}
