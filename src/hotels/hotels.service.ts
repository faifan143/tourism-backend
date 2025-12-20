import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReservationStatus } from '@prisma/client';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateHotelDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.hotel.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        pricePerNight: dto.pricePerNight,
        roomTypes: dto.roomTypes
          ? {
              create: dto.roomTypes.map((rt) => ({
                name: rt.name,
                description: rt.description,
                maxGuests: rt.maxGuests,
                pricePerNight: rt.pricePerNight,
                capacity: rt.capacity,
              })),
            }
          : undefined,
      },
      include: {
        roomTypes: true,
      },
    });
  }

  findAll(cityId?: string) {
    return this.prisma.hotel.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        roomTypes: true,
      },
    });
  }

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        city: true,
        roomTypes: true,
        trips: true,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found.');
    }

    return hotel;
  }

  async update(
    id: string,
    dto: UpdateHotelDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.hotel.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        pricePerNight: dto.pricePerNight,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prisma.hotel.delete({
      where: { id },
    });

    return { success: true };
  }

  findRoomTypesByHotel(hotelId: string) {
    return this.prisma.roomType.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      include: {
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
            },
          },
        },
      },
    });
  }

  async addRoomType(hotelId: string, dto: CreateRoomTypeDto) {
    await this.ensureExists(hotelId);

    return this.prisma.roomType.create({
      data: {
        hotelId,
        name: dto.name,
        description: dto.description,
        maxGuests: dto.maxGuests,
        pricePerNight: dto.pricePerNight,
        capacity: dto.capacity,
      },
    });
  }

  async updateRoomType(roomTypeId: string, dto: UpdateRoomTypeDto) {
    await this.ensureRoomTypeExists(roomTypeId);

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        name: dto.name,
        description: dto.description,
        maxGuests: dto.maxGuests,
        pricePerNight: dto.pricePerNight,
        capacity: dto.capacity,
      },
    });
  }

  async removeRoomType(roomTypeId: string) {
    await this.ensureRoomTypeExists(roomTypeId);

    await this.prisma.roomType.delete({
      where: { id: roomTypeId },
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.hotel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Hotel not found.');
    }
  }

  private async ensureRoomTypeExists(id: string) {
    const exists = await this.prisma.roomType.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Room type not found.');
    }
  }
}
