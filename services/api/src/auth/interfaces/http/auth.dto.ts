import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 1 })
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  refreshToken!: string;
}

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  password!: string;

  @ApiProperty()
  firstname!: string;

  @ApiProperty()
  lastname!: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender!: string;

  @ApiProperty({ format: 'date', example: '2001-04-12' })
  dataofbirth!: string;
}
