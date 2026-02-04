import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReservationStatus, RoomStatus } from '@prisma/client';
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

    // Find the room with its room type and hotel
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: {
        roomType: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    // Check if room is available (not in maintenance)
    if (room.status === RoomStatus.MAINTENANCE) {
      throw new BadRequestException('This room is currently under maintenance.');
    }

    // Check if room is already booked
    if (room.status === RoomStatus.BOOKED) {
      throw new BadRequestException('This room is already booked.');
    }

    // Check if there are overlapping reservations for this specific room
    // Overlap occurs when: newStart < existing.endDate AND newEnd > existing.startDate
    const overlappingReservations = await this.prisma.reservation.findMany({
      where: {
        roomId: dto.roomId,
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

    if (overlappingReservations.length > 0) {
      throw new BadRequestException(
        'This room is not available for the selected dates.',
      );
    }

    // Check if guests exceed room capacity
    if (dto.guests > room.roomType.maxGuests) {
      throw new BadRequestException(
        `This room can only accommodate ${room.roomType.maxGuests} guests.`,
      );
    }

    const nights = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const totalPrice = room.roomType.pricePerNight * nights * dto.guests;

    return this.prisma.reservation.create({
      data: {
        userId,
        roomId: dto.roomId,
        roomTypeId: room.roomTypeId, // Keep for reference
        startDate,
        endDate,
        guests: dto.guests,
        totalPrice,
        status: ReservationStatus.PENDING,
      },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
          },
        },
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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

  async findOneForUser(userId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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
      include: {
        room: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    // Update room status when cancelling
    if (status === ReservationStatus.CANCELLED && reservation.roomId) {
      await this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    // Update room status based on reservation status
    if (reservation.roomId) {
      if (status === ReservationStatus.CONFIRMED) {
        await this.prisma.room.update({
          where: { id: reservation.roomId },
          data: { status: RoomStatus.BOOKED },
        });
      } else if (status === ReservationStatus.CANCELLED) {
        await this.prisma.room.update({
          where: { id: reservation.roomId },
          data: { status: RoomStatus.AVAILABLE },
        });
      }
    }

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
        room: {
          include: {
            roomType: {
              include: {
                hotel: true,
              },
            },
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
