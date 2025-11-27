import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard';
import { User } from '../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateImagePreferencesDto } from './dto/update-preferences.dto';

@Controller('preferences')
@UseGuards(JwtGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get('me')
  getMyPreferences(@User() user: JwtPayload) {
    return this.preferencesService.getPreferences(user.sub);
  }

  @Patch('me')
  updateMyPreferences(
    @User() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(user.sub, dto);
  }

  @Patch('image')
  updateImagePreferences(
    @User() user: JwtPayload,
    @Body() dto: UpdateImagePreferencesDto,
  ) {
    return this.preferencesService.updateImagePreferences(user.sub, dto);
  }
}
