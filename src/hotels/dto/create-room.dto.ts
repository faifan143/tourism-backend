import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  roomNumber?: string;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}

