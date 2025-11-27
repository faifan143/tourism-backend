import { IsString, MaxLength } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @MaxLength(255)
  name!: string;
}

