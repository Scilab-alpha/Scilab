import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  password!: string;

  @ApiProperty({ minLength: 1 })
  firstName!: string;

  @ApiProperty({ minLength: 1 })
  lastName!: string;

  @ApiProperty({ format: 'date', example: '2000-01-02' })
  dateOfBirth!: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender!: string;
}
