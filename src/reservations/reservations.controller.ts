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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationStatus } from '@prisma/client';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @User('sub') userId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  findMyReservations(@User('sub') userId: string) {
    return this.reservationsService.findAllForUser(userId);
  }

  @Get('me/:id')
  @UseGuards(JwtGuard)
  findMyReservation(@User('sub') userId: string, @Param('id') id: string) {
    return this.reservationsService.findOneForUser(userId, id);
  }

  @Patch('me/:id/status')
  @UseGuards(JwtGuard)
  updateMyReservationStatus(
    @User('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatusForUser(
      userId,
      id,
      dto.status,
    );
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto.status);
  }
}
