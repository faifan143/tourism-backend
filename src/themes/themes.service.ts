import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateThemeDto } from './dto/create-theme.dto';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateThemeDto) {
    return this.prisma.theme.create({
      data: { name: dto.name },
    });
  }

  findAll() {
    return this.prisma.theme.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async remove(id: string) {
    await this.prisma.theme.delete({
      where: { id },
    });

    return { success: true };
  }
}

