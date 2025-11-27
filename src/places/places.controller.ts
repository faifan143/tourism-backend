import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { AddImageDto } from './dto/add-image.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { UpdateThemesDto } from './dto/update-themes.dto';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() dto: CreatePlaceDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.placesService.create(dto, images);
  }

  @Get()
  findAll(@Query('cityId') cityId?: string) {
    return this.placesService.findAll(cityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.placesService.update(id, dto, images);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addImage(@Param('id') id: string, @Body() dto: AddImageDto) {
    return this.placesService.addImage(id, dto.imageUrl);
  }

  @Delete(':id/images/:file')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeImage(@Param('id') id: string, @Param('file') imageUrl: string) {
    return this.placesService.removeImage(id, decodeURIComponent(imageUrl));
  }

  @Patch(':id/categories')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateCategories(@Param('id') id: string, @Body() dto: UpdateCategoriesDto) {
    return this.placesService.updateCategories(id, dto);
  }

  @Patch(':id/themes')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateThemes(@Param('id') id: string, @Body() dto: UpdateThemesDto) {
    return this.placesService.updateThemes(id, dto);
  }
}
