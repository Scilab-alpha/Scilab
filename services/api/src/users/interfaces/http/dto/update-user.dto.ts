import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ format: 'email' })
  email?: string;

  @ApiPropertyOptional({ nullable: true })
  firstName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  imgUrl?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true })
  gender?: string | null;
}
