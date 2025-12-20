import { IsEnum } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class UpdateTripReservationStatusDto {
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;
}
