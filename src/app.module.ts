import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { ThemesModule } from './themes/themes.module';
import { PlacesModule } from './places/places.module';
import { ActivitiesModule } from './activities/activities.module';
import { HotelsModule } from './hotels/hotels.module';
import { ReservationsModule } from './reservations/reservations.module';
import { TripsModule } from './trips/trips.module';
import { TripReservationsModule } from './trip-reservations/trip-reservations.module';
import { BrowseModule } from './browse/browse.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { PreferencesModule } from './preferences/preferences.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    StorageModule,
    CountriesModule,
    CitiesModule,
    CategoriesModule,
    ThemesModule,
    PlacesModule,
    ActivitiesModule,
    HotelsModule,
    ReservationsModule,
    TripsModule,
    TripReservationsModule,
    BrowseModule,
    EmbeddingsModule,
    PreferencesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
