import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionScope, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Scope } from '../common/decorators/scope.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { UpdateTripActivitiesDto } from './dto/update-trip-activities.dto';
import { UpdateTripHotelDto } from './dto/update-trip-hotel.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateTripDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.tripsService.create(dto, image);
  }

  @Get()
  findAll(@Query('cityId') cityId?: string) {
    return this.tripsService.findAll(cityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, ScopeGuard)
  @Scope(PermissionScope.TRIP, 'id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.tripsService.update(id, dto, image);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }

  @Patch(':id/activities')
  @UseGuards(JwtGuard, ScopeGuard)
  @Scope(PermissionScope.TRIP, 'id')
  updateActivities(
    @Param('id') id: string,
    @Body() dto: UpdateTripActivitiesDto,
  ) {
    return this.tripsService.updateActivities(id, dto);
  }

  @Patch(':id/hotel')
  @UseGuards(JwtGuard, ScopeGuard)
  @Scope(PermissionScope.TRIP, 'id')
  updateHotel(@Param('id') id: string, @Body() dto: UpdateTripHotelDto) {
    return this.tripsService.updateHotel(id, dto);
  }
}
