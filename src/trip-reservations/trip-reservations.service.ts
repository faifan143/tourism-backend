import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PermissionScope, ReservationStatus, Role } from '@prisma/client';
import { CreateTripReservationDto } from './dto/create-trip-reservation.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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

  async findAllForAdmin(actor: JwtPayload) {
    if (actor.role === Role.ADMIN) return this.findAll();

    const perms = await this.prisma.subAdminPermission.findMany({
      where: { userId: actor.sub, scope: PermissionScope.TRIP },
    });
    const tripIds = perms.map((p) => p.resourceId);

    return this.prisma.tripReservation.findMany({
      where: { tripId: { in: tripIds } },
      include: {
        user: { select: { id: true, email: true, role: true } },
        trip: { include: { city: true, hotel: true, activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForAdmin(id: string, actor: JwtPayload) {
    const reservation = await this.findOne(id);

    if (actor.role === Role.SUB_ADMIN) {
      const perm = await this.prisma.subAdminPermission.findUnique({
        where: {
          userId_scope_resourceId: {
            userId: actor.sub,
            scope: PermissionScope.TRIP,
            resourceId: reservation.tripId,
          },
        },
      });
      if (!perm) throw new ForbiddenException('Access denied.');
    }

    return reservation;
  }

  async updateStatusForAdmin(
    id: string,
    status: ReservationStatus,
    actor: JwtPayload,
  ) {
    if (actor.role === Role.SUB_ADMIN) {
      await this.findOneForAdmin(id, actor);
    }
    return this.updateStatus(id, status);
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
