import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { CreateTripReservationDto } from './dto/create-trip-reservation.dto';

@Injectable()
export class TripReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTripReservationDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }

    return this.prisma.tripReservation.create({
      data: {
        userId,
        tripId: dto.tripId,
        guests: dto.guests,
        status: ReservationStatus.PENDING,
      },
      include: {
        trip: true,
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.tripReservation.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const reservation = await this.prisma.tripReservation.findFirst({
      where: { id, userId },
      include: {
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Trip reservation not found.');
    }

    return reservation;
  }

  async updateStatusForUser(
    userId: string,
    id: string,
    status: ReservationStatus,
  ) {
    if (status !== ReservationStatus.CANCELLED) {
      throw new ForbiddenException('Users can only cancel trip reservations.');
    }

    const reservation = await this.prisma.tripReservation.findFirst({
      where: { id, userId },
    });

    if (!reservation) {
      throw new NotFoundException('Trip reservation not found.');
    }

    return this.prisma.tripReservation.update({
      where: { id },
      data: { status },
      include: {
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.tripReservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Trip reservation not found.');
    }

    return reservation;
  }

  async updateStatus(id: string, status: ReservationStatus) {
    await this.ensureExists(id);

    return this.prisma.tripReservation.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        trip: {
          include: {
            city: true,
            hotel: true,
            activities: true,
          },
        },
      },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.tripReservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Trip reservation not found.');
    }
  }
}
