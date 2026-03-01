import {
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class TripStopDto {
  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  /** Number of days at this city (e.g. 2 = "Day 1-2: Aleppo"). Default 1. */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  days?: number;

  /** Activity IDs for this stop (activities at this city/place). */
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v) => v != null && v !== '');
    if (typeof value === 'string') return [value];
    return value;
  })
  activityIds?: string[];

  /** Place IDs to visit at this stop (must be in the stop's city). */
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v) => v != null && v !== '');
    if (typeof value === 'string') return [value];
    return value;
  })
  placeIds?: string[];
}
