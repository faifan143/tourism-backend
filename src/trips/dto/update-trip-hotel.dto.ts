import { IsOptional, IsUUID } from 'class-validator';

export class UpdateTripHotelDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;
}
