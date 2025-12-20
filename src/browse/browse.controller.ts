import { Controller, Get, Param, Query } from '@nestjs/common';
import { BrowseService } from './browse.service';

@Controller('browse')
export class BrowseController {
  constructor(private readonly browseService: BrowseService) {}

  @Get('countries')
  getCountries() {
    return this.browseService.getCountries();
  }

  @Get('cities')
  getCities(@Query('countryId') countryId?: string) {
    return this.browseService.getCities(countryId);
  }

  @Get('places')
  getPlaces(@Query('cityId') cityId?: string) {
    return this.browseService.getPlaces(cityId);
  }

  @Get('places/:id')
  getPlace(@Param('id') id: string) {
    return this.browseService.getPlace(id);
  }

  @Get('activities')
  getActivities(@Query('placeId') placeId?: string) {
    return this.browseService.getActivities(placeId);
  }

  @Get('hotels')
  getHotels(@Query('cityId') cityId?: string) {
    return this.browseService.getHotels(cityId);
  }

  @Get('hotels/:id')
  getHotel(@Param('id') id: string) {
    return this.browseService.getHotel(id);
  }

  @Get('trips')
  getTrips(@Query('cityId') cityId?: string) {
    return this.browseService.getTrips(cityId);
  }

  @Get('trips/:id')
  getTrip(@Param('id') id: string) {
    return this.browseService.getTrip(id);
  }
}
