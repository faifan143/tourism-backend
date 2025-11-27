import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  placeId?: string;
}
