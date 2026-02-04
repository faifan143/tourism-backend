import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async register(@Body() dto: RegisterDto, @User() actor: JwtPayload) {
    // RolesGuard allows both ADMIN and SUB_ADMIN (via hasAdminAccess check)
    // Additional validation in service prevents privilege escalation
    return this.authService.register(dto, actor);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@User('sub') userId: string) {
    return this.authService.me(userId);
  }
}

