import { Injectable } from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';
import { CitiesService } from '../cities/cities.service';
import { PlacesService } from '../places/places.service';
import { ActivitiesService } from '../activities/activities.service';
import { HotelsService } from '../hotels/hotels.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class BrowseService {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly citiesService: CitiesService,
    private readonly placesService: PlacesService,
    private readonly activitiesService: ActivitiesService,
    private readonly hotelsService: HotelsService,
    private readonly tripsService: TripsService,
  ) {}

  getCountries() {
    return this.countriesService.findAll();
  }

  getCities(countryId?: string) {
    return this.citiesService.findAll(countryId);
  }

  getPlaces(cityId?: string) {
    return this.placesService.findAll(cityId);
  }

  getPlace(id: string) {
    return this.placesService.findOne(id);
  }

  getActivities(placeId?: string) {
    return this.activitiesService.findAll(placeId);
  }

  getHotels(cityId?: string) {
    return this.hotelsService.findAll(cityId);
  }

  getHotel(id: string) {
    return this.hotelsService.findOne(id);
  }

  getTrips(cityId?: string) {
    return this.tripsService.findAll(cityId);
  }

  getTrip(id: string) {
    return this.tripsService.findOne(id);
  }
}
