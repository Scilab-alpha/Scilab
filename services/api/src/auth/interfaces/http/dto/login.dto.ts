import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ minLength: 1 })
  password!: string;
}
