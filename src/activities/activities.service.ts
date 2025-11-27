import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateActivityDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.activity.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        placeId: dto.placeId,
      },
    });
  }

  findAll(placeId?: string) {
    return this.prisma.activity.findMany({
      where: placeId ? { placeId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        place: true,
      },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        place: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    return activity;
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        placeId: dto.placeId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prisma.activity.delete({
      where: { id },
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Activity not found.');
    }
  }
}
