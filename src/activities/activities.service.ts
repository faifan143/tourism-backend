import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
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

  async update(id: string, dto: UpdateActivityDto) {
    await this.ensureExists(id);

    return this.prisma.activity.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
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
