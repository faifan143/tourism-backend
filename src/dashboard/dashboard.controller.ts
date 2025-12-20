import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { DashboardService } from './dashboard.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('guest')
  getGuestDashboard() {
    return this.dashboardService.getGuestDashboard();
  }

  @Get('user')
  @UseGuards(JwtGuard)
  getUserDashboard(@User('sub') userId: string) {
    return this.dashboardService.getUserDashboard(userId);
  }

  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}

