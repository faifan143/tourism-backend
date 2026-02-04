import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { canCreateRole, hasAdminAccess } from '../common/utils/roles.util';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: Role) {
    const where = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSubAdmins() {
    return this.findAll(Role.SUB_ADMIN);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Check if actor can modify this user's role
    if (dto.role !== undefined && dto.role !== user.role) {
      // Prevent privilege escalation
      if (!canCreateRole(actor.role, dto.role)) {
        throw new ForbiddenException(
          'You do not have permission to assign this role.',
        );
      }

      // Prevent demoting admins (only full admins can do this)
      if (
        user.role === Role.ADMIN &&
        actor.role !== Role.ADMIN &&
        dto.role !== Role.ADMIN
      ) {
        throw new ForbiddenException(
          'Only full administrators can modify admin users.',
        );
      }

      // Prevent sub-admins from modifying other sub-admins
      if (
        user.role === Role.SUB_ADMIN &&
        actor.role === Role.SUB_ADMIN &&
        actor.sub !== user.id
      ) {
        throw new ForbiddenException(
          'You cannot modify other sub-administrators.',
        );
      }
    }

    // Check email uniqueness if email is being updated
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use.');
      }
    }

    const updateData: Partial<User> = {};

    if (dto.email) {
      updateData.email = dto.email;
    }

    if (dto.password) {
      updateData.password = await this.hashPassword(dto.password);
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string, actor: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Prevent deleting yourself
    if (actor.sub === user.id) {
      throw new ForbiddenException('You cannot delete your own account.');
    }

    // Prevent sub-admins from deleting admins or other sub-admins
    if (
      actor.role === Role.SUB_ADMIN &&
      (user.role === Role.ADMIN || user.role === Role.SUB_ADMIN)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this user.',
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully.' };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

