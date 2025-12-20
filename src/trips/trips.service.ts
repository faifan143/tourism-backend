import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { UpdateTripActivitiesDto } from './dto/update-trip-activities.dto';
import { UpdateTripHotelDto } from './dto/update-trip-hotel.dto';

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateTripDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.trip.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        hotelId: dto.hotelId,
        price: dto.price,
        activities: dto.activityIds
          ? {
              connect: dto.activityIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }

  findAll(cityId?: string) {
    return this.prisma.trip.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        hotel: true,
        activities: true,
      },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        city: true,
        hotel: true,
        activities: true,
        reservations: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }

    return trip;
  }

  async update(
    id: string,
    dto: UpdateTripDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        hotelId: dto.hotelId,
        price: dto.price,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prisma.trip.delete({
      where: { id },
    });

    return { success: true };
  }

  async updateActivities(id: string, dto: UpdateTripActivitiesDto) {
    await this.ensureExists(id);

    return this.prisma.trip.update({
      where: { id },
      data: {
        activities: {
          set: dto.activityIds.map((activityId) => ({ id: activityId })),
        },
      },
      include: {
        activities: true,
      },
    });
  }

  async updateHotel(id: string, dto: UpdateTripHotelDto) {
    await this.ensureExists(id);

    return this.prisma.trip.update({
      where: { id },
      data: {
        hotelId: dto.hotelId ?? null,
      },
      include: {
        hotel: true,
      },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Trip not found.');
    }
  }
}
