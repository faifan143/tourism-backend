import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    // Verify target user is a SUB_ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== Role.SUB_ADMIN) {
      throw new ForbiddenException('Permissions can only be assigned to sub-admins.');
    }

    const existing = await this.prisma.subAdminPermission.findUnique({
      where: { userId_scope_resourceId: { userId: dto.userId, scope: dto.scope, resourceId: dto.resourceId } },
    });
    if (existing) throw new ConflictException('Permission already exists.');

    return this.prisma.subAdminPermission.create({ data: dto });
  }

  async findAll(userId?: string) {
    return this.prisma.subAdminPermission.findMany({
      where: userId ? { userId } : {},
      orderBy: { id: 'asc' },
    });
  }

  async remove(id: string) {
    const perm = await this.prisma.subAdminPermission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found.');
    await this.prisma.subAdminPermission.delete({ where: { id } });
    return { message: 'Permission removed.' };
  }
}
