import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Username must be at least 2 characters' })
  @MaxLength(50, { message: 'Username must be at most 50 characters' })
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
