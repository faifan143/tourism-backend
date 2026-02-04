import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../common/decorators/user.decorator';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BulkAddRoomsDto, BulkRemoveRoomsDto } from './dto/bulk-rooms.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateHotelDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.hotelsService.create(dto, image);
  }

  @Get()
  findAll(
    @Query('cityId') cityId?: string,
    @User('role') userRole?: Role,
  ) {
    const isAdmin = userRole === Role.ADMIN;
    return this.hotelsService.findAll(cityId, isAdmin);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @User('role') userRole?: Role,
  ) {
    const isAdmin = userRole === Role.ADMIN;
    return this.hotelsService.findOne(id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.hotelsService.update(id, dto, image);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.hotelsService.remove(id);
  }

  @Get(':hotelId/room-types')
  findRoomTypes(
    @Param('hotelId') hotelId: string,
    @User('role') userRole?: Role,
  ) {
    const isAdmin = userRole === Role.ADMIN;
    return this.hotelsService.findRoomTypesByHotel(hotelId, isAdmin);
  }

  @Post(':hotelId/room-types')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addRoomType(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.hotelsService.addRoomType(hotelId, dto);
  }

  @Patch(':hotelId/room-types/:roomTypeId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRoomType(
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.hotelsService.updateRoomType(roomTypeId, dto);
  }

  @Delete(':hotelId/room-types/:roomTypeId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeRoomType(@Param('roomTypeId') roomTypeId: string) {
    return this.hotelsService.removeRoomType(roomTypeId);
  }

  @Get(':hotelId/room-types/:roomTypeId/rooms')
  findRooms(@Param('roomTypeId') roomTypeId: string) {
    return this.hotelsService.findRoomsByRoomType(roomTypeId);
  }

  @Post(':hotelId/room-types/:roomTypeId/rooms')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addRoom(
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.hotelsService.addRoom(roomTypeId, dto);
  }

  @Patch(':hotelId/room-types/:roomTypeId/rooms/:roomId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRoom(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.hotelsService.updateRoom(roomId, dto);
  }

  @Delete(':hotelId/room-types/:roomTypeId/rooms/:roomId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeRoom(@Param('roomId') roomId: string) {
    return this.hotelsService.removeRoom(roomId);
  }

  @Post(':hotelId/room-types/:roomTypeId/rooms/bulk-add')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  bulkAddRooms(
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: BulkAddRoomsDto,
  ) {
    return this.hotelsService.bulkAddRooms(roomTypeId, dto);
  }

  @Post(':hotelId/room-types/:roomTypeId/rooms/bulk-remove')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  bulkRemoveRooms(
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: BulkRemoveRoomsDto,
  ) {
    return this.hotelsService.bulkRemoveRooms(roomTypeId, dto);
  }
}
