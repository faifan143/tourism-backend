import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { CitiesModule } from '../cities/cities.module';
import { PlacesModule } from '../places/places.module';
import { ActivitiesModule } from '../activities/activities.module';
import { BrowseService } from './browse.service';
import { BrowseController } from './browse.controller';

@Module({
  imports: [CountriesModule, CitiesModule, PlacesModule, ActivitiesModule],
  controllers: [BrowseController],
  providers: [BrowseService],
})
export class BrowseModule {}
