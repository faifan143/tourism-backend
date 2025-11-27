import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  countryId!: string;
}
