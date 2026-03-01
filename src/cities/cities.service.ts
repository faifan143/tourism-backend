import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateCityDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.city.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        countryId: dto.countryId,
        routeOrder: dto.routeOrder,
      },
    });
  }

  findAll(countryId?: string) {
    return this.prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: countryId
        ? [{ routeOrder: 'asc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
      include: {
        country: true,
      },
    });
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        country: true,
      },
    });

    if (!city) {
      throw new NotFoundException('City not found.');
    }

    return city;
  }

  async update(
    id: string,
    dto: UpdateCityDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    const data: any = {
      name: dto.name,
      description: dto.description,
      imageUrl,
      countryId: dto.countryId,
    };
    if (dto.routeOrder !== undefined) data.routeOrder = dto.routeOrder;

    return this.prisma.city.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    // Get all places in this city
    const places = await this.prisma.place.findMany({
      where: { cityId: id },
      select: { id: true },
    });
    const placeIds = places.map((p) => p.id);

    // Get all hotels in this city
    const hotels = await this.prisma.hotel.findMany({
      where: { cityId: id },
      select: { id: true },
    });
    const hotelIds = hotels.map((h) => h.id);

    // Get all room types in these hotels
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId: { in: hotelIds } },
      select: { id: true },
    });
    const roomTypeIds = roomTypes.map((rt) => rt.id);

    // Get all trips in this city
    const trips = await this.prisma.trip.findMany({
      where: { cityId: id },
      select: { id: true },
    });
    const tripIds = trips.map((t) => t.id);

    // Delete trip reservations
    if (tripIds.length > 0) {
      await this.prisma.tripReservation.deleteMany({
        where: { tripId: { in: tripIds } },
      });
    }

    // Delete trip stops (also those referencing this city directly)
    await this.prisma.tripStop.deleteMany({
      where: {
        OR: [
          { tripId: { in: tripIds.length > 0 ? tripIds : [] } },
          { cityId: id },
        ],
      },
    });

    // Delete trips
    if (tripIds.length > 0) {
      await this.prisma.trip.deleteMany({
        where: { id: { in: tripIds } },
      });
    }

    // Delete reservations for room types/rooms
    if (roomTypeIds.length > 0) {
      await this.prisma.reservation.deleteMany({
        where: {
          OR: [
            { roomTypeId: { in: roomTypeIds } },
            { room: { roomTypeId: { in: roomTypeIds } } },
          ],
        },
      });
      await this.prisma.room.deleteMany({
        where: { roomTypeId: { in: roomTypeIds } },
      });
      await this.prisma.roomType.deleteMany({
        where: { id: { in: roomTypeIds } },
      });
    }

    // Delete hotels
    if (hotelIds.length > 0) {
      await this.prisma.hotel.deleteMany({
        where: { id: { in: hotelIds } },
      });
    }

    // Delete embeddings for places
    if (placeIds.length > 0) {
      await this.prisma.embedding.deleteMany({
        where: { ownerId: { in: placeIds } },
      });
    }

    // Delete activities linked to places
    const activities = await this.prisma.activity.findMany({
      where: { placeId: { in: placeIds } },
      select: { id: true },
    });
    const activityIds = activities.map((a) => a.id);
    if (activityIds.length > 0) {
      await this.prisma.embedding.deleteMany({
        where: { ownerId: { in: activityIds } },
      });
      await this.prisma.activity.deleteMany({
        where: { id: { in: activityIds } },
      });
    }

    // Delete places
    if (placeIds.length > 0) {
      await this.prisma.place.deleteMany({
        where: { id: { in: placeIds } },
      });
    }

    await this.prisma.city.delete({
      where: { id },
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.city.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('City not found.');
    }
  }
}
