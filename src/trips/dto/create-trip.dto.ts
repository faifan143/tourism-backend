import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import { TripStopDto } from './trip-stop.dto';

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

  /** Required for single-city trips. Omitted when using stops (multi-city). */
  @ValidateIf((o) => !o.stops?.length)
  @IsUUID()
  cityId?: string;

  /** Optional for single-city trips. Ignored when using stops. */
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  /** Multi-city: ordered stops (city + optional hotel). When provided, must have at least one; cityId/hotelId are derived from first stop. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'stops must have at least one stop when provided' })
  @ValidateNested({ each: true })
  @Type(() => TripStopDto)
  stops?: TripStopDto[];

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
