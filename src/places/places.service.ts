import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { UpdateThemesDto } from './dto/update-themes.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePlaceDto) {
    return this.prisma.place.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        imageUrls: dto.imageUrls || [],
        cityId: dto.cityId,
      },
    });
  }

  findAll(cityId?: string) {
    return this.prisma.place.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: {
        city: true,
        categories: true,
        themes: true,
        activities: true,
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found.');
    }

    return place;
  }

  async update(id: string, dto: UpdatePlaceDto) {
    await this.ensureExists(id);

    return this.prisma.place.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        imageUrls: dto.imageUrls,
        cityId: dto.cityId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prisma.place.delete({
      where: { id },
    });

    return { success: true };
  }

  async addImage(id: string, imageUrl: string) {
    const place = await this.ensureExists(id);

    const currentUrls = place.imageUrls || [];
    if (currentUrls.includes(imageUrl)) {
      throw new BadRequestException('Image URL already exists.');
    }

    return this.prisma.place.update({
      where: { id },
      data: {
        imageUrls: [...currentUrls, imageUrl],
      },
    });
  }

  async removeImage(id: string, imageUrl: string) {
    const place = await this.ensureExists(id);

    const currentUrls = place.imageUrls || [];
    if (!currentUrls.includes(imageUrl)) {
      throw new NotFoundException('Image URL not found.');
    }

    return this.prisma.place.update({
      where: { id },
      data: {
        imageUrls: currentUrls.filter((url) => url !== imageUrl),
      },
    });
  }

  async updateCategories(id: string, dto: UpdateCategoriesDto) {
    await this.ensureExists(id);

    return this.prisma.place.update({
      where: { id },
      data: {
        categories: {
          set: dto.categoryIds.map((categoryId) => ({ id: categoryId })),
        },
      },
      include: {
        categories: true,
      },
    });
  }

  async updateThemes(id: string, dto: UpdateThemesDto) {
    await this.ensureExists(id);

    return this.prisma.place.update({
      where: { id },
      data: {
        themes: {
          set: dto.themeIds.map((themeId) => ({ id: themeId })),
        },
      },
      include: {
        themes: true,
      },
    });
  }

  private async ensureExists(id: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      select: { id: true, imageUrls: true },
    });

    if (!place) {
      throw new NotFoundException('Place not found.');
    }

    return place;
  }
}
