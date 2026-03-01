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
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
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
    UsersModule,
    PermissionsModule,
    OllamaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
