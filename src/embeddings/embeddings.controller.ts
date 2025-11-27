import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmbeddingsService } from './embeddings.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('place/:placeId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createForPlace(
    @Param('placeId') placeId: string,
    @Body() dto: CreateEmbeddingDto,
  ) {
    return this.embeddingsService.createForPlace(placeId, dto);
  }

  @Post('activity/:activityId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createForActivity(
    @Param('activityId') activityId: string,
    @Body() dto: CreateEmbeddingDto,
  ) {
    return this.embeddingsService.createForActivity(activityId, dto);
  }

  @Get('place/:placeId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getByPlaceId(@Param('placeId') placeId: string) {
    return this.embeddingsService.getByPlaceId(placeId);
  }
}
