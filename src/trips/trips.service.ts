import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  /** Validate that stops follow logical city order (routeOrder) within each country. Only enforced when cities have explicit routeOrder set (> 0). */
  private async validateStopsOrder(cityIds: string[]): Promise<void> {
    if (cityIds.length <= 1) return;
    const cities = await this.prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, countryId: true, routeOrder: true },
    });
    const byId = new Map(cities.map((c) => [c.id, c]));
    for (let i = 1; i < cityIds.length; i++) {
      const prev = byId.get(cityIds[i - 1]);
      const curr = byId.get(cityIds[i]);
      if (!prev || !curr) continue;
      const sameCountry = prev.countryId === curr.countryId;
      const wrongOrder = prev.routeOrder >= curr.routeOrder;
      const hasExplicitOrder = prev.routeOrder > 0 || curr.routeOrder > 0;
      if (sameCountry && wrongOrder && hasExplicitOrder) {
        throw new BadRequestException(
          `Cities must follow logical route order within a country (e.g. Aleppo → Homs → Damascus). Check city routeOrder.`,
        );
      }
    }
  }

  async create(dto: CreateTripDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    const price = typeof dto.price === 'string' ? Number(dto.price) : dto.price;

    let activityIds: string[] | undefined;
    const rawActivityIds = (dto as any).activityIds;
    if (rawActivityIds !== undefined && rawActivityIds !== null) {
      activityIds = Array.isArray(rawActivityIds)
        ? rawActivityIds
        : [String(rawActivityIds)];
    }

    const useStops = dto.stops && dto.stops.length > 0;
    if (useStops) {
      const cityIds = dto.stops!.map((s) => s.cityId);
      await this.validateStopsOrder(cityIds);
      const first = dto.stops![0];
      const trip = await this.prisma.trip.create({
        data: {
          name: dto.name,
          description: dto.description,
          imageUrl,
          cityId: first.cityId,
          hotelId: first.hotelId ?? undefined,
          price,
          activities:
            activityIds && activityIds.length > 0
              ? { connect: activityIds.map((id) => ({ id })) }
              : undefined,
          stops: {
            create: dto.stops!.map((s, idx) => ({
              cityId: s.cityId,
              hotelId: s.hotelId ?? null,
              order: idx,
              days: s.days ?? 1,
              activities:
                s.activityIds && s.activityIds.length > 0
                  ? { connect: s.activityIds.map((id) => ({ id })) }
                  : undefined,
              places:
                s.placeIds && s.placeIds.length > 0
                  ? { connect: s.placeIds.map((id) => ({ id })) }
                  : undefined,
            })),
          },
        },
        include: {
          city: true,
          hotel: true,
          activities: true,
          stops: {
            orderBy: { order: 'asc' },
            include: {
              city: true,
              hotel: true,
              activities: true,
              places: { include: { city: true } },
            },
          },
        },
      });
      return trip;
    }

    if (!dto.cityId) {
      throw new BadRequestException('Either cityId or stops must be provided.');
    }

    return this.prisma.trip.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        hotelId: dto.hotelId,
        price,
        activities:
          activityIds && activityIds.length > 0
            ? { connect: activityIds.map((id) => ({ id })) }
            : undefined,
      },
      include: {
        city: true,
        hotel: true,
        activities: true,
        stops: {
          orderBy: { order: 'asc' },
          include: {
            city: true,
            hotel: true,
            activities: true,
            places: { include: { city: true } },
          },
        },
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
        stops: {
          orderBy: { order: 'asc' },
          include: {
            city: true,
            hotel: true,
            activities: true,
            places: { include: { city: true } },
          },
        },
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
        stops: {
          orderBy: { order: 'asc' },
          include: {
            city: true,
            hotel: true,
            activities: true,
            places: { include: { city: true } },
          },
        },
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

    const useStops = dto.stops && dto.stops.length > 0;
    if (useStops) {
      const cityIds = dto.stops!.map((s) => s.cityId);
      await this.validateStopsOrder(cityIds);
      const first = dto.stops![0];
      await this.prisma.tripStop.deleteMany({ where: { tripId: id } });
      return this.prisma.trip.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          imageUrl,
          cityId: first.cityId,
          hotelId: first.hotelId ?? null,
          price:
            dto.price !== undefined
              ? typeof dto.price === 'string'
                ? Number(dto.price)
                : dto.price
              : undefined,
          stops: {
            create: dto.stops!.map((s, idx) => ({
              cityId: s.cityId,
              hotelId: s.hotelId ?? null,
              order: idx,
              days: s.days ?? 1,
              activities:
                s.activityIds && s.activityIds.length > 0
                  ? { connect: s.activityIds.map((id) => ({ id })) }
                  : undefined,
              places:
                s.placeIds && s.placeIds.length > 0
                  ? { connect: s.placeIds.map((id) => ({ id })) }
                  : undefined,
            })),
          },
        },
        include: {
          city: true,
          hotel: true,
          activities: true,
          stops: {
            orderBy: { order: 'asc' },
            include: {
              city: true,
              hotel: true,
              activities: true,
              places: { include: { city: true } },
            },
          },
        },
      });
    }

    const data: any = {
      name: dto.name,
      description: dto.description,
      imageUrl,
      cityId: dto.cityId,
      hotelId: dto.hotelId,
    };

    if (dto.price !== undefined) {
      data.price =
        typeof dto.price === 'string' ? Number(dto.price) : dto.price;
    }

    return this.prisma.trip.update({
      where: { id },
      data,
      include: {
        city: true,
        hotel: true,
        activities: true,
        stops: {
          orderBy: { order: 'asc' },
          include: {
            city: true,
            hotel: true,
            activities: true,
            places: { include: { city: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    // Delete trip reservations
    await this.prisma.tripReservation.deleteMany({
      where: { tripId: id },
    });

    // Delete trip stops (also handled by onDelete: Cascade, but explicit for safety)
    await this.prisma.tripStop.deleteMany({
      where: { tripId: id },
    });

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
