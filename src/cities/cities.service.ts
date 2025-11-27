import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCityDto) {
    return this.prisma.city.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        countryId: dto.countryId,
      },
    });
  }

  findAll(countryId?: string) {
    return this.prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      throw new NotFoundException('City not found.');
    }

    return city;
  }

  async update(id: string, dto: UpdateCityDto) {
    await this.ensureExists(id);

    return this.prisma.city.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        countryId: dto.countryId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

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

