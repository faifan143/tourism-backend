import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date.');
    }

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.roomTypeId },
      include: {
        hotel: true,
      },
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found.');
    }

    // Check availability: count overlapping non-cancelled reservations
    // Overlap occurs when: newStart < existing.endDate AND newEnd > existing.startDate
    const overlappingReservations = await this.prisma.reservation.findMany({
      where: {
        roomTypeId: dto.roomTypeId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        AND: [
          {
            startDate: {
              lt: endDate,
            },
          },
          {
            endDate: {
              gt: startDate,
            },
          },
        ],
      },
    });

    if (overlappingReservations.length >= roomType.capacity) {
      throw new BadRequestException(
        'No availability for this room type in the selected dates.',
      );
    }

    const nights = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const totalPrice = roomType.pricePerNight * nights * dto.guests;

    return this.prisma.reservation.create({
      data: {
        userId,
        roomTypeId: dto.roomTypeId,
        startDate,
        endDate,
        guests: dto.guests,
        totalPrice,
        status: ReservationStatus.PENDING,
      },
      include: {
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
      include: {
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return reservation;
  }

  async updateStatusForUser(
    userId: string,
    id: string,
    status: ReservationStatus,
  ) {
    if (status !== ReservationStatus.CANCELLED) {
      throw new ForbiddenException('Users can only cancel reservations.');
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.reservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return reservation;
  }

  async updateStatus(id: string, status: ReservationStatus) {
    await this.ensureExists(id);

    return this.prisma.reservation.update({
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
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.reservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Reservation not found.');
    }
  }
}
