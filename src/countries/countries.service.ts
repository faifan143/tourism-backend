import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateCountryDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.country.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
      },
    });
  }

  findAll() {
    return this.prisma.country.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found.');
    }

    return country;
  }

  async update(
    id: string,
    dto: UpdateCountryDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.country.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    // Get all cities in this country
    const cities = await this.prisma.city.findMany({
      where: { countryId: id },
      select: { id: true },
    });
    const cityIds = cities.map((c) => c.id);

    if (cityIds.length > 0) {
      // Get all places in these cities
      const places = await this.prisma.place.findMany({
        where: { cityId: { in: cityIds } },
        select: { id: true },
      });
      const placeIds = places.map((p) => p.id);

      // Get all hotels in these cities
      const hotels = await this.prisma.hotel.findMany({
        where: { cityId: { in: cityIds } },
        select: { id: true },
      });
      const hotelIds = hotels.map((h) => h.id);

      // Get all room types in these hotels
      const roomTypes = await this.prisma.roomType.findMany({
        where: { hotelId: { in: hotelIds } },
        select: { id: true },
      });
      const roomTypeIds = roomTypes.map((rt) => rt.id);

      // Get all trips in these cities
      const trips = await this.prisma.trip.findMany({
        where: { cityId: { in: cityIds } },
        select: { id: true },
      });
      const tripIds = trips.map((t) => t.id);

      // Delete trip reservations
      if (tripIds.length > 0) {
        await this.prisma.tripReservation.deleteMany({
          where: { tripId: { in: tripIds } },
        });
      }

      // Delete trip stops
      if (tripIds.length > 0) {
        await this.prisma.tripStop.deleteMany({
          where: { tripId: { in: tripIds } },
        });
      }

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

      // Delete cities
      await this.prisma.city.deleteMany({
        where: { countryId: id },
      });
    }

    await this.prisma.country.delete({
      where: { id },
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.country.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Country not found.');
    }
  }
}
