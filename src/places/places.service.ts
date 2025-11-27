import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { UpdateThemesDto } from './dto/update-themes.dto';

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreatePlaceDto, imageFiles?: Express.Multer.File[]) {
    let imageUrls = dto.imageUrls || [];

    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file) =>
        this.storageService.uploadFile(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.map((result) => result.publicUrl);
      imageUrls = [...imageUrls, ...uploadedUrls];
    }

    return this.prisma.place.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        imageUrls,
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

  async update(
    id: string,
    dto: UpdatePlaceDto,
    imageFiles?: Express.Multer.File[],
  ) {
    await this.ensureExists(id);

    let imageUrls = dto.imageUrls;

    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file) =>
        this.storageService.uploadFile(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.map((result) => result.publicUrl);

      // If imageUrls is provided, merge with uploaded files
      // Otherwise, use only uploaded files
      if (imageUrls) {
        imageUrls = [...imageUrls, ...uploadedUrls];
      } else {
        // Get existing imageUrls and merge with new ones
        const existing = await this.prisma.place.findUnique({
          where: { id },
          select: { imageUrls: true },
        });
        imageUrls = [...(existing?.imageUrls || []), ...uploadedUrls];
      }
    }

    return this.prisma.place.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        imageUrls,
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
