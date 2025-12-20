import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TripReservationsModule } from '../trip-reservations/trip-reservations.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    DatabaseModule,
    ReservationsModule,
    TripReservationsModule,
    PreferencesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

