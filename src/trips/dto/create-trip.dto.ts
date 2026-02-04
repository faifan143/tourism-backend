import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTripDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined && v !== '');
    if (typeof value === 'string') return [value];
    return [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  activityIds?: string[];

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? Number(value) : value;
  })
  @IsNumber()
  @Min(0)
  price!: number;
}
