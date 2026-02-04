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
      },
    });
  }

  findAll(countryId?: string) {
    return this.prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { createdAt: 'desc' },
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

    return this.prisma.city.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
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
