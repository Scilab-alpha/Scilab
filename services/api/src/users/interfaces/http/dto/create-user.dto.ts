import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  password!: string;

  @ApiProperty({ enum: ['EMAIL', 'GOOGLE'] })
  type!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  status!: string;

  @ApiProperty({ enum: ['STUDENT', 'RESEARCHER', 'ADMIN'] })
  role!: string;

  @ApiPropertyOptional({ nullable: true })
  firstName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true })
  gender?: string | null;
}
