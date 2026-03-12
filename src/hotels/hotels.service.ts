import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReservationStatus, RoomStatus } from '@prisma/client';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BulkAddRoomsDto, BulkRemoveRoomsDto } from './dto/bulk-rooms.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateHotelDto, imageFile?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    // Handle roomTypes - ensure it's an array and parse if needed
    let roomTypes: CreateRoomTypeDto[] | undefined;
    const rawRoomTypes = (dto as any).roomTypes;
    if (rawRoomTypes !== undefined && rawRoomTypes !== null) {
      if (Array.isArray(rawRoomTypes)) {
        roomTypes = rawRoomTypes;
      } else if (typeof rawRoomTypes === 'string') {
        try {
          roomTypes = JSON.parse(rawRoomTypes);
        } catch {
          roomTypes = undefined;
        }
      }
    }

    const hotel = await this.prisma.hotel.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl,
        cityId: dto.cityId,
        roomTypes:
          roomTypes && roomTypes.length > 0
            ? {
                create: roomTypes.map((rt) => ({
                  name: rt.name,
                  description: rt.description,
                  maxGuests:
                    typeof rt.maxGuests === 'string'
                      ? Number(rt.maxGuests)
                      : rt.maxGuests,
                  pricePerNight:
                    typeof rt.pricePerNight === 'string'
                      ? Number(rt.pricePerNight)
                      : rt.pricePerNight,
                  capacity:
                    typeof rt.capacity === 'string'
                      ? Number(rt.capacity)
                      : rt.capacity,
                })),
              }
            : undefined,
      },
      include: {
        roomTypes: true,
      },
    });

    // Create initial rooms for room types that specify initialRoomCount
    if (roomTypes && roomTypes.length > 0) {
      for (const rt of roomTypes) {
        const initialRoomCount = rt.initialRoomCount
          ? typeof rt.initialRoomCount === 'string'
            ? Number(rt.initialRoomCount)
            : rt.initialRoomCount
          : 0;

        if (initialRoomCount > 0) {
          const roomType = hotel.roomTypes.find((r) => r.name === rt.name);
          if (roomType) {
            const rooms: Array<{
              roomTypeId: string;
              roomNumber: string;
              status: RoomStatus;
            }> = [];

            for (let i = 1; i <= initialRoomCount; i++) {
              const roomNumber = rt.roomNumberPrefix
                ? `${rt.roomNumberPrefix}-${i}`
                : `${i}`;

              rooms.push({
                roomTypeId: roomType.id,
                roomNumber,
                status: RoomStatus.AVAILABLE,
              });
            }

            await this.prisma.room.createMany({
              data: rooms,
            });
          }
        }
      }
    }

    // Return hotel with all room types and their rooms
    return this.prisma.hotel.findUnique({
      where: { id: hotel.id },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });
  }

  async findAll(cityId?: string, isAdmin: boolean = false) {
    const hotels = await this.prisma.hotel.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        roomTypes: {
          include: {
            rooms: isAdmin
              ? true
              : {
                  where: {
                    status: RoomStatus.AVAILABLE,
                  },
                },
          },
        },
      },
    });

    // For regular users, transform to show only available room counts
    if (!isAdmin) {
      return hotels.map((hotel) => ({
        ...hotel,
        roomTypes: hotel.roomTypes.map((roomType) => ({
          ...roomType,
          availableRoomsCount: roomType.rooms.length,
          rooms: undefined, // Remove rooms array for users
        })),
      }));
    }

    return hotels;
  }

  async findOne(id: string, isAdmin: boolean = false) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        city: true,
        roomTypes: {
          include: {
            rooms: isAdmin
              ? true
              : {
                  where: {
                    status: RoomStatus.AVAILABLE,
                  },
                },
          },
        },
        trips: true,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found.');
    }

    // For regular users, transform to show only available room counts
    if (!isAdmin) {
      return {
        ...hotel,
        roomTypes: hotel.roomTypes.map((roomType) => {
          const { rooms, ...roomTypeWithoutRooms } = roomType;
          return {
            ...roomTypeWithoutRooms,
            availableRoomsCount: rooms.length,
          };
        }),
      };
    }

    return hotel;
  }

  async update(
    id: string,
    dto: UpdateHotelDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.ensureExists(id);

    let imageUrl = dto.imageUrl;

    if (imageFile) {
      const uploadResult = await this.storageService.uploadFile(imageFile);
      imageUrl = uploadResult.publicUrl;
    }

    const data: any = {
      name: dto.name,
      description: dto.description,
      imageUrl,
      cityId: dto.cityId,
    };

    // Handle roomTypes - ensure it's an array and parse if needed
    let roomTypes: CreateRoomTypeDto[] | undefined;
    const rawRoomTypes = (dto as any).roomTypes;
    if (rawRoomTypes !== undefined && rawRoomTypes !== null) {
      if (Array.isArray(rawRoomTypes)) {
        roomTypes = rawRoomTypes;
      } else if (typeof rawRoomTypes === 'string') {
        try {
          roomTypes = JSON.parse(rawRoomTypes);
        } catch {
          roomTypes = undefined;
        }
      }
    }

    // Get existing hotel with room types
    const existingHotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        roomTypes: true,
      },
    });

    if (!existingHotel) {
      throw new NotFoundException('Hotel not found.');
    }

    // Update the hotel basic fields first
    const hotel = await this.prisma.hotel.update({
      where: { id },
      data,
      include: {
        roomTypes: true,
      },
    });

    // Handle room types: update existing, create new, delete removed
    if (roomTypes !== undefined) {
      const existingRoomTypeIds = existingHotel.roomTypes.map((rt) => rt.id);
      const incomingRoomTypeIds = roomTypes
        .filter((rt) => rt.id)
        .map((rt) => rt.id!);

      // Delete room types that are not in the incoming list
      const roomTypesToDelete = existingRoomTypeIds.filter(
        (id) => !incomingRoomTypeIds.includes(id),
      );

      if (roomTypesToDelete.length > 0) {
        // First, delete all rooms associated with these room types
        await this.prisma.room.deleteMany({
          where: {
            roomTypeId: { in: roomTypesToDelete },
          },
        });

        // Then delete the room types
        await this.prisma.roomType.deleteMany({
          where: {
            id: { in: roomTypesToDelete },
            hotelId: id,
          },
        });
      }

      // Process each room type: update existing or create new
      for (const rt of roomTypes) {
        const roomTypeData = {
          name: rt.name,
          description: rt.description,
          maxGuests:
            typeof rt.maxGuests === 'string'
              ? Number(rt.maxGuests)
              : rt.maxGuests,
          pricePerNight:
            typeof rt.pricePerNight === 'string'
              ? Number(rt.pricePerNight)
              : rt.pricePerNight,
          capacity:
            typeof rt.capacity === 'string' ? Number(rt.capacity) : rt.capacity,
        };

        if (rt.id && existingRoomTypeIds.includes(rt.id)) {
          // Update existing room type
          await this.prisma.roomType.update({
            where: { id: rt.id },
            data: roomTypeData,
          });
        } else {
          // Create new room type
          const newRoomType = await this.prisma.roomType.create({
            data: {
              ...roomTypeData,
              hotelId: id,
            },
          });

          // Create initial rooms for newly created room types only
          const initialRoomCount = rt.initialRoomCount
            ? typeof rt.initialRoomCount === 'string'
              ? Number(rt.initialRoomCount)
              : rt.initialRoomCount
            : 0;

          if (initialRoomCount > 0) {
            const rooms: Array<{
              roomTypeId: string;
              roomNumber: string;
              status: RoomStatus;
            }> = [];

            // Get existing room count for this room type to continue numbering
            const existingRooms = await this.prisma.room.findMany({
              where: { roomTypeId: newRoomType.id },
              orderBy: { createdAt: 'desc' },
            });
            const startNumber = existingRooms.length + 1;

            for (let i = 0; i < initialRoomCount; i++) {
              const roomNumber = rt.roomNumberPrefix
                ? `${rt.roomNumberPrefix}-${startNumber + i}`
                : `${startNumber + i}`;

              rooms.push({
                roomTypeId: newRoomType.id,
                roomNumber,
                status: RoomStatus.AVAILABLE,
              });
            }

            await this.prisma.room.createMany({
              data: rooms,
            });
          }
        }
      }
    }

    // Return hotel with all room types and their rooms
    return this.prisma.hotel.findUnique({
      where: { id: hotel.id },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    // Get all room type IDs for this hotel
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId: id },
      select: { id: true },
    });
    const roomTypeIds = roomTypes.map((rt) => rt.id);

    if (roomTypeIds.length > 0) {
      // Delete reservations linked to rooms or room types of this hotel
      await this.prisma.reservation.deleteMany({
        where: {
          OR: [
            { roomTypeId: { in: roomTypeIds } },
            { room: { roomTypeId: { in: roomTypeIds } } },
          ],
        },
      });

      // Delete all rooms belonging to these room types
      await this.prisma.room.deleteMany({
        where: { roomTypeId: { in: roomTypeIds } },
      });

      // Delete the room types themselves
      await this.prisma.roomType.deleteMany({
        where: { hotelId: id },
      });
    }

    // Nullify hotel reference on trips and trip stops (optional FK)
    await this.prisma.trip.updateMany({
      where: { hotelId: id },
      data: { hotelId: null },
    });
    await this.prisma.tripStop.updateMany({
      where: { hotelId: id },
      data: { hotelId: null },
    });

    // Now safe to delete the hotel
    await this.prisma.hotel.delete({
      where: { id },
    });

    return { success: true };
  }

  findRoomTypesByHotel(hotelId: string, isAdmin: boolean = false) {
    return this.prisma.roomType
      .findMany({
        where: { hotelId },
        orderBy: { createdAt: 'desc' },
        include: {
          rooms: isAdmin
            ? true
            : {
                where: {
                  status: RoomStatus.AVAILABLE,
                },
              },
          reservations: {
            where: {
              status: {
                in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
              },
            },
          },
        },
      })
      .then((roomTypes) => {
        // For regular users, transform to show only available room counts
        if (!isAdmin) {
          return roomTypes.map((roomType) => {
            const { rooms, ...roomTypeWithoutRooms } = roomType;
            return {
              ...roomTypeWithoutRooms,
              availableRoomsCount: rooms.length,
            };
          });
        }
        return roomTypes;
      });
  }

  async addRoomType(hotelId: string, dto: CreateRoomTypeDto) {
    await this.ensureExists(hotelId);

    const roomType = await this.prisma.roomType.create({
      data: {
        hotelId,
        name: dto.name,
        description: dto.description,
        maxGuests:
          typeof dto.maxGuests === 'string'
            ? Number(dto.maxGuests)
            : dto.maxGuests,
        pricePerNight:
          typeof dto.pricePerNight === 'string'
            ? Number(dto.pricePerNight)
            : dto.pricePerNight,
        capacity:
          typeof dto.capacity === 'string'
            ? Number(dto.capacity)
            : dto.capacity,
      },
    });

    // Create initial rooms if specified
    const initialRoomCount = dto.initialRoomCount
      ? typeof dto.initialRoomCount === 'string'
        ? Number(dto.initialRoomCount)
        : dto.initialRoomCount
      : 0;

    if (initialRoomCount > 0) {
      const rooms: Array<{
        roomTypeId: string;
        roomNumber: string;
        status: RoomStatus;
      }> = [];

      for (let i = 1; i <= initialRoomCount; i++) {
        const roomNumber = dto.roomNumberPrefix
          ? `${dto.roomNumberPrefix}-${i}`
          : `${i}`;

        rooms.push({
          roomTypeId: roomType.id,
          roomNumber,
          status: RoomStatus.AVAILABLE,
        });
      }

      await this.prisma.room.createMany({
        data: rooms,
      });
    }

    return this.prisma.roomType.findUnique({
      where: { id: roomType.id },
      include: {
        rooms: true,
      },
    });
  }

  async updateRoomType(roomTypeId: string, dto: UpdateRoomTypeDto) {
    await this.ensureRoomTypeExists(roomTypeId);

    const data: any = {
      name: dto.name,
      description: dto.description,
    };

    // Convert numeric fields if provided
    if (dto.maxGuests !== undefined) {
      data.maxGuests =
        typeof dto.maxGuests === 'string'
          ? Number(dto.maxGuests)
          : dto.maxGuests;
    }
    if (dto.pricePerNight !== undefined) {
      data.pricePerNight =
        typeof dto.pricePerNight === 'string'
          ? Number(dto.pricePerNight)
          : dto.pricePerNight;
    }
    if (dto.capacity !== undefined) {
      data.capacity =
        typeof dto.capacity === 'string' ? Number(dto.capacity) : dto.capacity;
    }

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data,
    });
  }

  async removeRoomType(roomTypeId: string) {
    await this.ensureRoomTypeExists(roomTypeId);

    // Delete reservations linked to this room type or its rooms
    await this.prisma.reservation.deleteMany({
      where: {
        OR: [{ roomTypeId }, { room: { roomTypeId } }],
      },
    });

    // Delete all rooms in this room type
    await this.prisma.room.deleteMany({
      where: { roomTypeId },
    });

    await this.prisma.roomType.delete({
      where: { id: roomTypeId },
    });

    return { success: true };
  }

  findRoomsByRoomType(roomTypeId: string) {
    return this.prisma.room.findMany({
      where: { roomTypeId },
      orderBy: { createdAt: 'desc' },
      include: {
        roomType: true,
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
            },
          },
        },
      },
    });
  }

  async addRoom(roomTypeId: string, dto: CreateRoomDto) {
    await this.ensureRoomTypeExists(roomTypeId);

    return this.prisma.room.create({
      data: {
        roomTypeId,
        roomNumber: dto.roomNumber,
        status: dto.status || 'AVAILABLE',
      },
      include: {
        roomType: true,
      },
    });
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto) {
    await this.ensureRoomExists(roomId);

    const data: any = {};

    if (dto.roomNumber !== undefined) {
      data.roomNumber = dto.roomNumber;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data,
      include: {
        roomType: true,
      },
    });
  }

  async removeRoom(roomId: string) {
    await this.ensureRoomExists(roomId);

    // Delete reservations linked to this room
    await this.prisma.reservation.deleteMany({
      where: { roomId },
    });

    await this.prisma.room.delete({
      where: { id: roomId },
    });

    return { success: true };
  }

  async bulkAddRooms(roomTypeId: string, dto: BulkAddRoomsDto) {
    await this.ensureRoomTypeExists(roomTypeId);

    // Get current room count to generate sequential room numbers
    const existingRooms = await this.prisma.room.findMany({
      where: { roomTypeId },
      orderBy: { createdAt: 'desc' },
    });

    const rooms: Array<{
      roomTypeId: string;
      roomNumber: string;
      status: RoomStatus;
    }> = [];
    const startNumber = existingRooms.length + 1;

    for (let i = 0; i < dto.count; i++) {
      const roomNumber = dto.roomNumberPrefix
        ? `${dto.roomNumberPrefix}-${startNumber + i}`
        : `${startNumber + i}`;

      rooms.push({
        roomTypeId,
        roomNumber,
        status: RoomStatus.AVAILABLE,
      });
    }

    await this.prisma.room.createMany({
      data: rooms,
    });

    return {
      success: true,
      added: dto.count,
      message: `Successfully added ${dto.count} room(s) to this room type.`,
    };
  }

  async bulkRemoveRooms(roomTypeId: string, dto: BulkRemoveRoomsDto) {
    await this.ensureRoomTypeExists(roomTypeId);

    // Get available rooms first (prefer removing available over booked/maintenance)
    const availableRooms = await this.prisma.room.findMany({
      where: {
        roomTypeId,
        status: RoomStatus.AVAILABLE,
      },
      take: dto.count,
    });

    let remainingCount = dto.count - availableRooms.length;
    const roomsToDelete = [...availableRooms];

    // If we need more, get any rooms (including booked/maintenance)
    if (remainingCount > 0) {
      const additionalRooms = await this.prisma.room.findMany({
        where: {
          roomTypeId,
          id: {
            notIn: availableRooms.map((r) => r.id),
          },
        },
        take: remainingCount,
      });
      roomsToDelete.push(...additionalRooms);
    }

    if (roomsToDelete.length === 0) {
      throw new NotFoundException('No rooms found to remove.');
    }

    await this.prisma.room.deleteMany({
      where: {
        id: {
          in: roomsToDelete.map((r) => r.id),
        },
      },
    });

    return {
      success: true,
      removed: roomsToDelete.length,
      message: `Successfully removed ${roomsToDelete.length} room(s) from this room type.`,
    };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.hotel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Hotel not found.');
    }
  }

  private async ensureRoomTypeExists(id: string) {
    const exists = await this.prisma.roomType.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Room type not found.');
    }
  }

  private async ensureRoomExists(id: string) {
    const exists = await this.prisma.room.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Room not found.');
    }
  }
}
