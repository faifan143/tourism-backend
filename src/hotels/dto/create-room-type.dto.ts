import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoomTypeDto {
  @IsOptional()
  @IsString()
  id?: string; // Optional ID for updates

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? Number(value) : value;
  })
  @IsInt()
  @Min(1)
  maxGuests!: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? Number(value) : value;
  })
  @IsNumber()
  @Min(0)
  pricePerNight!: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? Number(value) : value;
  })
  @IsInt()
  @Min(1)
  capacity!: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? Number(value) : value;
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  initialRoomCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumberPrefix?: string;
}
