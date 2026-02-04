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

    const data: any = {
      name: dto.name,
      description: dto.description,
      location: dto.location,
      imageUrls,
      cityId: dto.cityId,
    };

    // Ensure categoryIds is an array (handle multipart form data quirks)
    let categoryIds: string[] | undefined;
    const rawCategoryIds = (dto as any).categoryIds;
    if (rawCategoryIds !== undefined && rawCategoryIds !== null) {
      if (Array.isArray(rawCategoryIds)) {
        categoryIds = rawCategoryIds;
      } else {
        // Handle case where multer might give us a single value
        categoryIds = [String(rawCategoryIds)];
      }
    }

    if (categoryIds && categoryIds.length > 0) {
      data.categories = {
        connect: categoryIds.map((id) => ({ id })),
      };
    }

    // Ensure themeIds is an array (handle multipart form data quirks)
    let themeIds: string[] | undefined;
    const rawThemeIds = (dto as any).themeIds;
    if (rawThemeIds !== undefined && rawThemeIds !== null) {
      if (Array.isArray(rawThemeIds)) {
        themeIds = rawThemeIds;
      } else {
        // Handle case where multer might give us a single value
        themeIds = [String(rawThemeIds)];
      }
    }

    if (themeIds && themeIds.length > 0) {
      data.themes = {
        connect: themeIds.map((id) => ({ id })),
      };
    }

    return this.prisma.place.create({
      data,
      include: {
        categories: true,
        themes: true,
      },
    });
  }

  findAll(cityId?: string) {
    return this.prisma.place.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        categories: true,
        themes: true,
      },
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

      // If imageUrls is provided in DTO, merge with uploaded files
      // Otherwise, get existing imageUrls and merge with new ones
      if (imageUrls !== undefined) {
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

    const data: any = {
      name: dto.name,
      description: dto.description,
      location: dto.location,
      cityId: dto.cityId,
    };

    // Only include imageUrls if it's defined (either from DTO or after processing uploaded files)
    if (imageUrls !== undefined) {
      data.imageUrls = imageUrls;
    }

    // Handle categoryIds (similar to create method)
    let categoryIds: string[] | undefined;
    const rawCategoryIds = (dto as any).categoryIds;
    if (rawCategoryIds !== undefined && rawCategoryIds !== null) {
      if (Array.isArray(rawCategoryIds)) {
        categoryIds = rawCategoryIds;
      } else {
        // Handle case where multer might give us a single value
        categoryIds = [String(rawCategoryIds)];
      }
    }

    if (categoryIds !== undefined) {
      if (categoryIds.length > 0) {
        data.categories = {
          set: categoryIds.map((id) => ({ id })),
        };
      } else {
        // Empty array means remove all categories
        data.categories = {
          set: [],
        };
      }
    }

    // Handle themeIds (similar to create method)
    let themeIds: string[] | undefined;
    const rawThemeIds = (dto as any).themeIds;
    if (rawThemeIds !== undefined && rawThemeIds !== null) {
      if (Array.isArray(rawThemeIds)) {
        themeIds = rawThemeIds;
      } else {
        // Handle case where multer might give us a single value
        themeIds = [String(rawThemeIds)];
      }
    }

    if (themeIds !== undefined) {
      if (themeIds.length > 0) {
        data.themes = {
          set: themeIds.map((id) => ({ id })),
        };
      } else {
        // Empty array means remove all themes
        data.themes = {
          set: [],
        };
      }
    }

    return this.prisma.place.update({
      where: { id },
      data,
      include: {
        categories: true,
        themes: true,
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
