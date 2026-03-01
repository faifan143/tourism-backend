import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User, SubAdminPermission } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { canCreateRole, hasAdminAccess } from '../common/utils/roles.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupDto } from './dto/signup.dto';
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

  /** Public signup: create a user with USER role and return token (same shape as login). */
  async signup(dto: SignupDto) {
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingByEmail) {
      throw new ConflictException('Email already in use.');
    }
    if (existingByUsername) {
      throw new ConflictException('Username already in use.');
    }

    const rawPassword = dto.password;
    if (rawPassword == null || typeof rawPassword !== 'string' || rawPassword.length < 8) {
      throw new BadRequestException('Password is required and must be at least 8 characters.');
    }
    const password = await this.hashPassword(rawPassword);
    const createdUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password,
        role: Role.USER,
      },
    });

    const accessToken = await this.signToken(createdUser);
    const permissions = await this.getPermissions(createdUser.id, createdUser.role);

    return {
      accessToken,
      user: this.stripSensitiveFields(createdUser),
      permissions,
    };
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
    const permissions = await this.getPermissions(user.id, user.role);

    return {
      accessToken,
      user: this.stripSensitiveFields(user),
      permissions,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const permissions = await this.getPermissions(user.id, user.role);

    return {
      ...this.stripSensitiveFields(user),
      permissions,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    if (password == null || typeof password !== 'string' || password.length === 0) {
      throw new BadRequestException('Password is required.');
    }
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

  private async getPermissions(
    userId: string,
    role: Role,
  ): Promise<SubAdminPermission[]> {
    if (role !== Role.SUB_ADMIN) return [];
    return this.prisma.subAdminPermission.findMany({ where: { userId } });
  }

  private stripSensitiveFields(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

