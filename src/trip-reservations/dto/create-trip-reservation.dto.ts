import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateTripReservationDto {
  @IsUUID()
  tripId!: string;

  @IsInt()
  @Min(1)
  guests!: number;
}
