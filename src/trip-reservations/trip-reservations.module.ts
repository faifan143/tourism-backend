import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TripReservationsService } from './trip-reservations.service';
import { TripReservationsController } from './trip-reservations.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TripReservationsController],
  providers: [TripReservationsService],
  exports: [TripReservationsService],
})
export class TripReservationsModule {}
