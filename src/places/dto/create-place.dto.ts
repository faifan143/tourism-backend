import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePlaceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined && v !== '');
    if (typeof value === 'string') return [value];
    return [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined && v !== '');
    if (typeof value === 'string') return [value];
    return [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  themeIds?: string[];
}
