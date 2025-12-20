import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  maxGuests!: number;

  @IsNumber()
  @Min(0)
  pricePerNight!: number;

  @IsInt()
  @Min(1)
  capacity!: number;
}
