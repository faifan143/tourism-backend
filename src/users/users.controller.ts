import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Get('sub-admins')
  findSubAdmins() {
    return this.usersService.findSubAdmins();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @User() actor: JwtPayload,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() actor: JwtPayload) {
    return this.usersService.remove(id, actor);
  }
}

