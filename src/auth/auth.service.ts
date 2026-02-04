import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { canCreateRole, hasAdminAccess } from '../common/utils/roles.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, actor: JwtPayload) {
    if (!hasAdminAccess(actor.role)) {
      throw new ForbiddenException('Only administrators can register new users.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const password = await this.hashPassword(dto.password);
    const role = dto.role ?? Role.USER;

    // Validate that the actor can create the requested role
    if (!canCreateRole(actor.role, role)) {
      throw new ForbiddenException(
        'You do not have permission to create users with this role.',
      );
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        role,
      },
    });

    return this.stripSensitiveFields(createdUser);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.signToken(user);

    return {
      accessToken,
      user: this.stripSensitiveFields(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.stripSensitiveFields(user);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async signToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  private stripSensitiveFields(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

