import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { User } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TripReservationsService } from './trip-reservations.service';
import { CreateTripReservationDto } from './dto/create-trip-reservation.dto';
import { UpdateTripReservationStatusDto } from './dto/update-trip-reservation-status.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('trip-reservations')
export class TripReservationsController {
  constructor(
    private readonly tripReservationsService: TripReservationsService,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @User('sub') userId: string,
    @Body() dto: CreateTripReservationDto,
  ) {
    return this.tripReservationsService.create(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  findMyTripReservations(@User('sub') userId: string) {
    return this.tripReservationsService.findAllForUser(userId);
  }

  @Get('me/:id')
  @UseGuards(JwtGuard)
  findMyTripReservation(@User('sub') userId: string, @Param('id') id: string) {
    return this.tripReservationsService.findOneForUser(userId, id);
  }

  @Patch('me/:id/status')
  @UseGuards(JwtGuard)
  updateMyTripReservationStatus(
    @User('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripReservationStatusDto,
  ) {
    return this.tripReservationsService.updateStatusForUser(
      userId,
      id,
      dto.status,
    );
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@User() actor: JwtPayload) {
    return this.tripReservationsService.findAllForAdmin(actor);
  }

  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string, @User() actor: JwtPayload) {
    return this.tripReservationsService.findOneForAdmin(id, actor);
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripReservationStatusDto,
    @User() actor: JwtPayload,
  ) {
    return this.tripReservationsService.updateStatusForAdmin(id, dto.status, actor);
  }
}
